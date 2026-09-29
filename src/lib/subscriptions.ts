import 'server-only';

/**
 * Get the subscription expiry date 30 days from now.
 */
export function getSubscriptionExpiryDate(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

/**
 * Check if a subscription is still active
 * @param expiryDate The subscription expiry date
 * @returns true if the subscription is still valid, false otherwise
 */
export function isSubscriptionActive(expiryDate: Date | null): boolean {
  if (!expiryDate) return false;
  return new Date() <= expiryDate;
}

/**
 * Format subscription expiry date for display
 * @param expiryDate The subscription expiry date
 * @returns Formatted string like "Expires: March 31, 2026"
 */
export function formatSubscriptionExpiry(expiryDate: Date | null): string {
  if (!expiryDate) return 'No expiry';
  const date = new Date(expiryDate);
  return `Expires: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

/**
 * Get days remaining in subscription
 * @param expiryDate The subscription expiry date
 * @returns Number of days remaining
 */
export function getDaysRemainingInSubscription(expiryDate: Date | null): number {
  if (!expiryDate) return 0;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
