/**
 * Strava API Client
 *
 * Handles OAuth token management, API requests with rate limiting,
 * and token refresh. All tokens are AES-256-GCM encrypted at rest.
 */

import { encrypt, decrypt } from "@/lib/security/encryption";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export type StravaTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
};

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCode(code: string): Promise<StravaTokens> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Strava token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  };
}

/**
 * Refresh an expired access token.
 */
export async function refreshTokens(
  refreshToken: string
): Promise<StravaTokens> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  };
}

/**
 * Get a valid access token, refreshing if expired.
 */
export async function getValidToken(
  encryptedAccessToken: string,
  encryptedRefreshToken: string,
  expiresAt: Date
): Promise<{
  accessToken: string;
  refreshed: boolean;
  newTokens?: StravaTokens;
}> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);

  // Token still valid (with 5-minute buffer)
  if (expiresAtUnix > now + 300) {
    return {
      accessToken: decrypt(encryptedAccessToken),
      refreshed: false,
    };
  }

  // Token expired — refresh
  const refreshToken = decrypt(encryptedRefreshToken);
  const newTokens = await refreshTokens(refreshToken);

  return {
    accessToken: newTokens.accessToken,
    refreshed: true,
    newTokens,
  };
}

/**
 * Encrypt tokens for storage.
 */
export function encryptTokens(tokens: StravaTokens) {
  return {
    accessTokenEncrypted: encrypt(tokens.accessToken),
    refreshTokenEncrypted: encrypt(tokens.refreshToken),
    tokenExpiresAt: new Date(tokens.expiresAt * 1000),
  };
}

/**
 * Make an authenticated Strava API request.
 */
export async function stravaFetch<T>(
  accessToken: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });

  // Handle rate limiting
  const rateLimitUsage = res.headers.get("X-RateLimit-Usage");
  if (rateLimitUsage) {
    const [fifteenMin, daily] = rateLimitUsage.split(",").map(Number);
    // Strava limits: 200/15min, 2000/day
    if (fifteenMin > 180 || daily > 1800) {
      console.warn(
        `Strava rate limit warning: ${fifteenMin}/200 (15min), ${daily}/2000 (daily)`
      );
    }
  }

  if (res.status === 429) {
    throw new Error("Strava rate limit exceeded");
  }

  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
