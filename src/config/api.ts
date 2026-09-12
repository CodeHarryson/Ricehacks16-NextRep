export type ApiRuntimeMode = 'simulator' | 'physical' | 'production';

export interface ApiRuntimeConfig {
  baseUrl: string;
  mode: ApiRuntimeMode;
  status: 'configured' | 'missing' | 'invalid';
  issue: string | null;
}

interface ResolveApiOptions {
  isDev?: boolean;
  isPhysicalDevice?: boolean;
  apiUrl?: string;
  simulatorApiUrl?: string;
  androidEmulatorApiUrl?: string;
  productionApiUrl?: string;
  platform?: 'ios' | 'android';
}

function normalize(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function detectPhysicalDevice(): boolean {
  // Keep the pure resolver usable by Node's test runner; Expo Device is loaded
  // only in the native runtime where its supported `isDevice` flag is present.
  // React Native's `process` shim has no `argv`, so guard before reading it.
  if (process.argv?.includes('--test')) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const device = require('expo-device') as { isDevice?: boolean };
    return device.isDevice === true;
  } catch {
    return false;
  }
}

// RFC 2606/6761 reserved names never resolve to a real deployment.
const PLACEHOLDER_HOST = /(^|\.)(example\.(com|net|org)|[^.]+\.(example|invalid|localhost|test)|localhost)$/i;

/**
 * Returns the normalized production API URL, or throws when it is missing, not HTTPS,
 * or a placeholder. Keep in sync with the build-time guard in app.config.js.
 */
export function validateProductionApiUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error('EXPO_PUBLIC_PRODUCTION_API_URL is required for production builds');
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error(`EXPO_PUBLIC_PRODUCTION_API_URL is not a valid URL: ${trimmed}`); }
  if (url.protocol !== 'https:') throw new Error(`EXPO_PUBLIC_PRODUCTION_API_URL must use https: ${trimmed}`);
  if (PLACEHOLDER_HOST.test(url.hostname)) throw new Error(`EXPO_PUBLIC_PRODUCTION_API_URL is a placeholder: ${trimmed}`);
  return trimmed.replace(/\/$/, '');
}

function resolveDevelopmentApiUrl(value: string | undefined, variable: string, mode: ApiRuntimeMode): ApiRuntimeConfig {
  const trimmed = value?.trim();
  if (!trimmed) return { baseUrl: '', mode, status: 'missing', issue: `${variable} is required for this development device.` };
  let url: URL;
  try { url = new URL(trimmed); } catch { return { baseUrl: '', mode, status: 'invalid', issue: `${variable} is not a valid URL: ${trimmed}` }; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { baseUrl: '', mode, status: 'invalid', issue: `${variable} must use http or https: ${trimmed}` };
  if (mode === 'physical' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase())) {
    return { baseUrl: '', mode, status: 'invalid', issue: `${variable} must use the development computer's LAN address on a physical device.` };
  }
  return { baseUrl: normalize(trimmed), mode, status: 'configured', issue: null };
}

/** Resolve the API endpoint without requiring an environment change between devices. */
export function resolveApiRuntimeConfig(options: ResolveApiOptions = {}): ApiRuntimeConfig {
  // React Native always defines __DEV__; plain Node (unit tests) is treated as development.
  const isDev = options.isDev ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production');
  const apiUrl = options.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;
  const simulatorApiUrl = options.simulatorApiUrl ?? process.env.EXPO_PUBLIC_SIMULATOR_API_URL;
  const androidEmulatorApiUrl = options.androidEmulatorApiUrl ?? process.env.EXPO_PUBLIC_ANDROID_EMULATOR_API_URL;
  const productionApiUrl = options.productionApiUrl ?? process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

  if (!isDev) {
    return { baseUrl: validateProductionApiUrl(productionApiUrl), mode: 'production', status: 'configured', issue: null };
  }

  if (options.isPhysicalDevice ?? detectPhysicalDevice()) {
    return resolveDevelopmentApiUrl(apiUrl, 'EXPO_PUBLIC_API_URL', 'physical');
  }

  const platform = options.platform ?? (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return (require('react-native') as { Platform?: { OS?: 'ios' | 'android' } }).Platform?.OS;
    } catch { return undefined; }
  })();
  if (platform === 'android' && androidEmulatorApiUrl?.trim()) {
    return resolveDevelopmentApiUrl(androidEmulatorApiUrl, 'EXPO_PUBLIC_ANDROID_EMULATOR_API_URL', 'simulator');
  }
  return resolveDevelopmentApiUrl(simulatorApiUrl, 'EXPO_PUBLIC_SIMULATOR_API_URL', 'simulator');
}

export const apiRuntimeConfig = resolveApiRuntimeConfig();
export const API_URL = apiRuntimeConfig.baseUrl;
