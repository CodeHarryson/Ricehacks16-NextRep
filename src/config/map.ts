export type MapConfigurationStatus = 'configured' | 'missing-style-url' | 'missing-api-key' | 'invalid-style-url';

export interface MapRuntimeConfig {
  styleUrl: string | null;
  apiKey: string;
  status: MapConfigurationStatus;
  issue: string | null;
}

/** Resolve MapTiler configuration without ever supplying a checked-in key or style fallback. */
export function resolveMapRuntimeConfig(
  styleValue = process.env.EXPO_PUBLIC_MAP_STYLE_URL,
  keyValue = process.env.EXPO_PUBLIC_MAPTILER_API_KEY,
): MapRuntimeConfig {
  const styleUrl = styleValue?.trim();
  const apiKey = keyValue?.trim() ?? '';
  if (!styleUrl) return { styleUrl: null, apiKey, status: 'missing-style-url', issue: 'EXPO_PUBLIC_MAP_STYLE_URL is required to render the map.' };
  let parsed: URL;
  try { parsed = new URL(styleUrl); } catch { return { styleUrl: null, apiKey, status: 'invalid-style-url', issue: `EXPO_PUBLIC_MAP_STYLE_URL is not a valid URL: ${styleUrl}` }; }
  if (parsed.protocol !== 'https:') return { styleUrl: null, apiKey, status: 'invalid-style-url', issue: 'EXPO_PUBLIC_MAP_STYLE_URL must use https.' };
  if (!apiKey) return { styleUrl: null, apiKey, status: 'missing-api-key', issue: 'EXPO_PUBLIC_MAPTILER_API_KEY is required to render the map.' };
  // The key is deliberately appended from its own environment variable instead of being stored in the style URL.
  parsed.searchParams.set('key', apiKey);
  return { styleUrl: parsed.toString(), apiKey, status: 'configured', issue: null };
}

export const mapRuntimeConfig = resolveMapRuntimeConfig();
