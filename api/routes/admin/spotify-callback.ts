import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { type AccessToken } from "@spotify/web-api-ts-sdk";
import { isAdmin } from "./is-admin";

export const adminSpotifyCallbackRoute = async (
  request: IRequest,
  env: Env,
): Promise<Response> => {
  const requestData = await request.json();
  const { code, redirectURL, sessionId } = requestData as {
    code?: string;
    redirectURL?: string;
    sessionId?: string;
  };

  if (!sessionId) {
    return generateJSONResponse({ message: "No session ID provided" }, 400);
  }

  if (!code) {
    return generateJSONResponse(
      { message: "No Spotify auth code provided" },
      400,
    );
  }
  if (!redirectURL) {
    return generateJSONResponse({ message: "No redirect URL provided" }, 400);
  }

  if (!(await isAdmin(sessionId, env))) {
    return generateJSONResponse({ message: "Unauthorized" }, 403);
  }

  // Exchange code for token
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
      ).toBase64()}`,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectURL,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    console.error("Failed to get admin spotify token", text);
    return generateJSONResponse(
      { message: "Failed to get Spotify token" },
      500,
    );
  }

  const response = (await tokenResponse.json()) as AccessToken;

  const kv = env.PERMISSIONS_KV;

  try {
    await kv.put("spotify:admin:auth", JSON.stringify(response));
  } catch (err) {
    console.error("Failed to write admin spotify auth to KV", err);
    return generateJSONResponse({ message: "Failed to persist tokens" }, 500);
  }

  return generateJSONResponse(
    { success: true, data: { expiresIn: response.expires_in } },
    200,
  );
};
