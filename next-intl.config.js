/**
 * Minimal next-intl config used by next-intl to find available locales.
 * See: https://next-intl.dev/docs/getting-started/app-router
 */
module.exports = {
  locales: ['si', 'en'],
  defaultLocale: 'si',
  // Set a default timezone to avoid ENVIRONMENT_FALLBACK warnings
  timeZone: 'Asia/Colombo',
};
