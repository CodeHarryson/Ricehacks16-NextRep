export type ApiRuntimeMode = 'simulator' | 'physical' | 'production';

export interface ApiRuntimeConfig {
  baseUrl: string;
  mode: ApiRuntimeMode;
}

interface ResolveApiOptions {
  isDev?: boolean;
  isPhysicalDevice?: boolean;
  apiUrl?: string;
  simulatorApiUrl?: string;
  productionApiUrl?: string;
}

function normalize(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return (trimmed && trimmed.length > 0 ? trimmed : fallback).replace(/\/$/, '');
}

function detectPhysicalDevice(): boolean {
  // Keep the pure resolver usable by Node's test runner; Expo Device is loaded
  // only in the native runtime where its supported `isDevice` flag is present.
  if (process.argv.includes('--test')) return true;
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

/** Resolve the API endpoint without requiring an environment change between devices. */
export function resolveApiRuntimeConfig(options: ResolveApiOptions = {}): ApiRuntimeConfig {
  // React Native always defines __DEV__; plain Node (unit tests) is treated as development.
  const isDev = options.isDev ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production');
  const apiUrl = options.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;
  const simulatorApiUrl = options.simulatorApiUrl ?? process.env.EXPO_PUBLIC_SIMULATOR_API_URL;
  const productionApiUrl = options.productionApiUrl ?? process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

  if (!isDev) {
    return { baseUrl: validateProductionApiUrl(productionApiUrl), mode: 'production' };
  }

  if (options.isPhysicalDevice ?? detectPhysicalDevice()) {
    return { baseUrl: normalize(apiUrl, 'http://168.5.171.62:3000'), mode: 'physical' };
  }

  return { baseUrl: normalize(simulatorApiUrl, 'http://127.0.0.1:3000'), mode: 'simulator' };
}

export const apiRuntimeConfig = resolveApiRuntimeConfig();
export const API_URL = apiRuntimeConfig.baseUrl;
