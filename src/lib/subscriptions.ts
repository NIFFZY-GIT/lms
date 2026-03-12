import 'server-only';
import { lastDayOfMonth } from 'date-fns';

/**
 * Get the subscription expiry date for the current month
 * Returns the last day of the current month at 23:59:59
 */
export function getSubscriptionExpiryDate(): Date {
  const now = new Date();
  const endOfMonth = lastDayOfMonth(now);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
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
