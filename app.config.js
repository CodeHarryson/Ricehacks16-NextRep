const base = require('./app.json');
const eas = require('./eas.json');

// Keep in sync with validateProductionApiUrl in src/config/api.ts.
const PLACEHOLDER_HOST = /(^|\.)(example\.(com|net|org)|[^.]+\.(example|invalid|localhost|test)|localhost)$/i;

/** Fail release EAS builds (non development-client profiles) that would ship without a real API. */
function assertProductionApiUrl() {
  const profile = process.env.EAS_BUILD_PROFILE;
  if (!profile || eas.build?.[profile]?.developmentClient) return;
  const value = process.env.EXPO_PUBLIC_PRODUCTION_API_URL?.trim();
  let url;
  try { url = value ? new URL(value) : null; } catch { url = null; }
  if (!url || url.protocol !== 'https:' || PLACEHOLDER_HOST.test(url.hostname)) {
    throw new Error(`EAS profile "${profile}" requires EXPO_PUBLIC_PRODUCTION_API_URL to be a real https URL (got "${value ?? ''}").`);
  }
}

module.exports = ({ config }) => {
  assertProductionApiUrl();
  return {
    ...config,
    ...base.expo,
    android: {
      ...base.expo.android,
      permissions: [
        ...new Set([
          ...(base.expo.android.permissions ?? []),
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.ACCESS_COARSE_LOCATION',
        ]),
      ],
    },
    plugins: [
      ...base.expo.plugins,
      '@maplibre/maplibre-react-native',
    ],
  };
};
