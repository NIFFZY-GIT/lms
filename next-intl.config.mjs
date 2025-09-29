// ESM variant of next-intl config. Some Next setups expect an ESM export.
const config = {
  locales: ['si', 'en'],
  defaultLocale: 'si',
  // Set a default timezone to avoid ENVIRONMENT_FALLBACK warnings
  timeZone: 'Asia/Colombo',
};

export default config;
