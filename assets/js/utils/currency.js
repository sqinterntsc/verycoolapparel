const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount) {
  const value = Number(amount);
  return usd.format(Number.isFinite(value) ? value : 0);
}

