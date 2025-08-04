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