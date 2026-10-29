# Interaction motion

All animation is native CSS in `assets/css/motion.css`, loaded last by `main.css`.
There are no animation libraries, CDN scripts, or build dependencies.

- Bag drawer: 480 ms eased slide in; 300 ms exit with a fading backdrop.
- Product dialog: 360 ms soft rise and scale; 240 ms exit.
- Buttons: a subtle surface sweep, 2 px hover lift, directional icon movement,
  and a short press state. Hover transitions reverse when the pointer leaves.
- Product cards, size controls, gallery controls, and collection filters share
  the same easing. Hover movement is limited to devices with a fine pointer.
- Toasts fade and rise; their exit completes before they become hidden.
- Mobile navigation expands and collapses in normal page flow. Hidden links
  become inert as soon as closing starts. Escape, outside clicks, and switching
  to a desktop viewport dismiss it.

`assets/js/utils/motion.js` only coordinates visibility and native dialog
lifecycles. It waits for CSS animations/transitions through `getAnimations()`
before calling `close()` or setting `hidden`. Native modal focus and scroll
locking remain in effect during exit; focus returns after dismissal. Reopening
invalidates pending exit callbacks. Cancelled animations also settle safely.

`@starting-style` supplies entry transitions. Older browsers use CSS keyframe
entry animations. `prefers-reduced-motion: reduce` removes animations and
transitions, so closing is immediate. If the animation API is unavailable,
visibility changes also complete immediately.

Tune durations and easing with the `--motion-*` and `--ease-*` properties at the
top of `motion.css`. Keep the reduced-motion override last.

Run lifecycle regressions with `node tests/motion.test.cjs`. Browser verification
should cover desktop/mobile entry and exit, Escape/backdrop dismissal, focus
return, rapid reopen, toast dismissal, and reduced-motion settings.

An optional browser suite is provided in `tests/motion-browser.py`. Install
Playwright in a separate Python environment, run `playwright install chromium`,
then `python tests/motion-browser.py`. It serves the site locally and saves
screenshots in the system temporary directory; it adds no site dependencies.

Implementation verification: nine motion lifecycle checks and the twelve
existing gallery/dialog checks passed (the latter with temporary DOM-double
support for the new helper). All ten JavaScript modules passed syntax checks,
all stylesheets parsed, and the static HTTP asset audit passed. Interactive
browser QA remains unverified in this session: macOS denied Chromium's Mach
port registration, the remote browser launcher was unavailable, and WebKit
did not provide a usable session. The optional browser suite was syntax-checked.
