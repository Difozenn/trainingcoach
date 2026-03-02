/**
 * Wahoo Cloud API Client
 *
 * OAuth 2.0 — same pattern as Strava.
 * Tokens are AES-256-GCM encrypted at rest.
 */

import { encrypt, decrypt } from "@/lib/security/encryption";

const WAHOO_API_BASE = "https://api.wahooligan.com";
const WAHOO_TOKEN_URL = "https://api.wahooligan.com/oauth/token";

export type WahooTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
};

export async function exchangeCode(code: string): Promise<WahooTokens> {
  const res = await fetch(WAHOO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.WAHOO_CLIENT_ID!,
      client_secret: process.env.WAHOO_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/wahoo/callback`,
    }),
  });
  if (!res.ok) throw new Error(`Wahoo token exchange failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}

export async function refreshTokens(refreshToken: string): Promise<WahooTokens> {
  const res = await fetch(WAHOO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.WAHOO_CLIENT_ID!,
      client_secret: process.env.WAHOO_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Wahoo token refresh failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}

export async function getValidToken(
  encryptedAccessToken: string,
  encryptedRefreshToken: string,
  expiresAt: Date
): Promise<{ accessToken: string; refreshed: boolean; newTokens?: WahooTokens }> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);

  // Token still valid (with 5-minute buffer)
  if (expiresAtUnix > now + 300) {
    return { accessToken: decrypt(encryptedAccessToken), refreshed: false };
  }

  // Token expired — refresh
  const refreshToken = decrypt(encryptedRefreshToken);
  const newTokens = await refreshTokens(refreshToken);
  return { accessToken: newTokens.accessToken, refreshed: true, newTokens };
}

export function encryptTokens(tokens: WahooTokens) {
  return {
    accessTokenEncrypted: encrypt(tokens.accessToken),
    refreshTokenEncrypted: encrypt(tokens.refreshToken),
    tokenExpiresAt: new Date(tokens.expiresAt * 1000),
  };
}

export async function wahooFetch<T>(
  accessToken: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${WAHOO_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 429) throw new Error("Wahoo rate limit exceeded");
  if (!res.ok) throw new Error(`Wahoo API error: ${res.status} ${res.statusText}`);

  return res.json();
}
