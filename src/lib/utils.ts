export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  if (process.env.VERCEL_URL) {
    // Vercel deployment
    return `https://${process.env.VERCEL_URL}`;
  }
  // Assume localhost for development
  return 'http://localhost:3000';
}

// Centralised currency formatter for Sri Lankan Rupees
// Always use this for displaying monetary values to ensure consistency.
const lkrFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | string | null | undefined) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  if (isNaN(num as number)) return 'LKR 0.00';
  const formatted = lkrFormatter.format(num as number); // Typically 'Rs 1,234.56'
  return formatted.replace(/^Rs\s?/, 'LKR ');
}