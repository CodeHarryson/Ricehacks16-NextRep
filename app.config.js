const base = require('./app.json');

module.exports = ({ config }) => ({
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
});
