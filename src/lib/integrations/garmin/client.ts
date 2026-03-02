/**
 * Garmin Health API Client — OAuth 1.0a
 *
 * Garmin uses OAuth 1.0a (consumer key/secret + access token/secret).
 * Access tokens are permanent (no refresh flow).
 *
 * Token storage:
 *  - accessTokenEncrypted = encrypted OAuth access token
 *  - refreshTokenEncrypted = encrypted OAuth access token SECRET (repurposed)
 *  - tokenExpiresAt = null (permanent tokens)
 */

import OAuth from "oauth-1.0a";
import { createHmac } from "crypto";
import { encrypt, decrypt } from "@/lib/security/encryption";

const GARMIN_API_BASE = "https://apis.garmin.com";
const GARMIN_REQUEST_TOKEN_URL = "https://connectapi.garmin.com/oauth-service/oauth/request_token";
const GARMIN_AUTHORIZE_URL = "https://connect.garmin.com/oauthConfirm";
const GARMIN_ACCESS_TOKEN_URL = "https://connectapi.garmin.com/oauth-service/oauth/access_token";

export type GarminTokens = {
  accessToken: string;
  accessTokenSecret: string;
};

function getOAuthClient(): OAuth {
  return new OAuth({
    consumer: {
      key: process.env.GARMIN_CONSUMER_KEY!,
      secret: process.env.GARMIN_CONSUMER_SECRET!,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

/**
 * Step 1: Get a request token from Garmin.
 * Returns the request token + secret (secret stored in encrypted cookie).
 */
export async function getRequestToken(): Promise<{
  oauthToken: string;
  oauthTokenSecret: string;
}> {
  const oauth = getOAuthClient();
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/garmin/callback`;

  const requestData = {
    url: GARMIN_REQUEST_TOKEN_URL,
    method: "POST" as const,
    data: { oauth_callback: callbackUrl },
  };

  const headers = oauth.toHeader(oauth.authorize(requestData));

  const res = await fetch(GARMIN_REQUEST_TOKEN_URL, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `oauth_callback=${encodeURIComponent(callbackUrl)}`,
  });

  if (!res.ok) {
    throw new Error(`Garmin request token failed: ${res.status}`);
  }

  const text = await res.text();
  const params = new URLSearchParams(text);
  const oauthToken = params.get("oauth_token");
  const oauthTokenSecret = params.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    throw new Error("Invalid response from Garmin request token endpoint");
  }

  return { oauthToken, oauthTokenSecret };
}

/**
 * Build the Garmin authorization URL for user redirect.
 */
export function buildAuthorizeUrl(oauthToken: string): string {
  return `${GARMIN_AUTHORIZE_URL}?oauth_token=${oauthToken}`;
}

/**
 * Step 3: Exchange the OAuth verifier for permanent access tokens.
 */
export async function exchangeVerifier(
  oauthToken: string,
  oauthTokenSecret: string,
  oauthVerifier: string
): Promise<GarminTokens> {
  const oauth = getOAuthClient();

  const requestData = {
    url: GARMIN_ACCESS_TOKEN_URL,
    method: "POST" as const,
    data: { oauth_verifier: oauthVerifier },
  };

  const token = { key: oauthToken, secret: oauthTokenSecret };
  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  const res = await fetch(GARMIN_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `oauth_verifier=${encodeURIComponent(oauthVerifier)}`,
  });

  if (!res.ok) {
    throw new Error(`Garmin access token exchange failed: ${res.status}`);
  }

  const text = await res.text();
  const params = new URLSearchParams(text);
  const accessToken = params.get("oauth_token");
  const accessTokenSecret = params.get("oauth_token_secret");

  if (!accessToken || !accessTokenSecret) {
    throw new Error("Invalid response from Garmin access token endpoint");
  }

  return { accessToken, accessTokenSecret };
}

/**
 * Encrypt Garmin tokens for DB storage.
 * accessTokenSecret goes in refreshTokenEncrypted (repurposed column).
 * tokenExpiresAt = null (permanent tokens).
 */
export function encryptTokens(tokens: GarminTokens) {
  return {
    accessTokenEncrypted: encrypt(tokens.accessToken),
    refreshTokenEncrypted: encrypt(tokens.accessTokenSecret),
    tokenExpiresAt: null,
  };
}

/**
 * Get decrypted Garmin tokens from DB.
 */
export function getGarminTokens(
  encryptedAccessToken: string,
  encryptedAccessTokenSecret: string
): GarminTokens {
  return {
    accessToken: decrypt(encryptedAccessToken),
    accessTokenSecret: decrypt(encryptedAccessTokenSecret),
  };
}

/**
 * Make an authenticated request to the Garmin Health API.
 */
export async function garminFetch<T>(
  tokens: GarminTokens,
  endpoint: string,
  options?: { method?: string; params?: Record<string, string> }
): Promise<T> {
  const url = `${GARMIN_API_BASE}${endpoint}`;
  const method = options?.method ?? "GET";

  const oauth = getOAuthClient();
  const requestData = {
    url: options?.params
      ? `${url}?${new URLSearchParams(options.params)}`
      : url,
    method: method as "GET" | "POST",
  };

  const token = { key: tokens.accessToken, secret: tokens.accessTokenSecret };
  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  const fetchUrl = options?.params
    ? `${url}?${new URLSearchParams(options.params)}`
    : url;

  const res = await fetch(fetchUrl, {
    method,
    headers: { ...headers, Accept: "application/json" },
  });

  if (res.status === 429) throw new Error("Garmin rate limit exceeded");
  if (!res.ok) throw new Error(`Garmin API error: ${res.status} ${res.statusText}`);

  return res.json();
}
