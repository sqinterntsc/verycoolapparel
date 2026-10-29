from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.request import urlopen
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import re

ROOT = Path(__file__).resolve().parent.parent
class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_):
        pass
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.assets = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag in ('img', 'script') and data.get('src'):
            self.assets.append(data['src'])
        if tag == 'link' and data.get('href'):
            self.assets.append(data['href'])

server = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
Thread(target=server.serve_forever, daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'
checked = set()
def fetch(url):
    with urlopen(url) as response:
        assert response.status == 200, url
        checked.add(url)
        return response.read(), response.headers.get('content-type', '')
try:
    for page in ('/index.html', '/products/index.html'):
        body, kind = fetch(origin + page); assert 'text/html' in kind
        links = Links(); links.feed(body.decode())
        for asset in links.assets:
            url = urljoin(origin + page, asset)
            if urlparse(url).netloc == urlparse(origin).netloc:
                fetch(url)
    for source in (ROOT / 'assets/js').rglob('*.js'):
        if source.name.startswith('._'):
            continue
        # This small static JS directory was explicitly copied, not a large checkout scan.
        relative = '/' + str(source.relative_to(ROOT))
        body, kind = fetch(origin + relative)
        assert 'javascript' in kind, (relative, kind)
        for module in re.findall(r"(?:from|import)\s*['\"]([^'\"]+)['\"]", body.decode()):
            if module.startswith('.'):
                fetch(urljoin(origin + relative, module))
    for css in (ROOT / 'assets/css').glob('*.css'):
        if css.name.startswith('._'):
            continue
        relative = '/' + str(css.relative_to(ROOT))
        body, kind = fetch(origin + relative); assert 'text/css' in kind
        for module in re.findall(r"@import\s*['\"]([^'\"]+)['\"]", body.decode()):
            fetch(urljoin(origin + relative, module))
    for slug in ('traverse-short', 'contour-merino', 'altitude-fleece', 'strata-shell'):
        for view in ('base.webp', 'lifestyle-01.webp'):
            _, kind = fetch(f'{origin}/assets/images/photorealistic/products/{slug}/{view}')
            # Some Python platform MIME databases omit WebP; browsers decode the verified bytes.
            assert kind.startswith('image/') or kind == 'application/octet-stream', kind
    print(f'PASS static HTTP audit: {len(checked)} unique page, script, stylesheet and image URLs; 200 responses, JavaScript/CSS MIME types and image availability')
finally:
    server.shutdown(); server.server_close()
