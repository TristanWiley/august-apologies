import type { KVSpotifyAdminCredentials } from "../types/kv";

export const getOverlaySpotifyCredentials = async (
  env: Env,
): Promise<KVSpotifyAdminCredentials | null> => {
  try {
    const kv = env.PERMISSIONS_KV;

    const raw = await kv.get("spotify:admin:auth");
    if (!raw) {
      console.warn("Spotify credentials not found in KV");
      return null;
    }

    const credentials = JSON.parse(raw) as KVSpotifyAdminCredentials;
    const now = Date.now();

    // Check if access token is expired
    if (
      credentials.access_token &&
      credentials.access_token_obtained_at &&
      credentials.access_token_expires_in
    ) {
      const tokenExpiredAt =
        credentials.access_token_obtained_at +
        credentials.access_token_expires_in * 1000;
      if (now < tokenExpiredAt) {
        // Token is still valid
        return credentials;
      }
    }

    // Token is expired or missing, refresh it using refresh token
    console.log("Refreshing Spotify access token...");
    const refreshResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: credentials.refresh_token,
          client_id: env.SPOTIFY_CLIENT_ID,
          client_secret: env.SPOTIFY_CLIENT_SECRET,
        }).toString(),
      },
    );

    if (!refreshResponse.ok) {
      console.error(
        "Failed to refresh Spotify access token:",
        await refreshResponse.text(),
      );
      return null;
    }

    const refreshedToken = (await refreshResponse.json()) as {
      access_token: string;
      expires_in: number;
    };

    // Update credentials with new access token
    const updatedCredentials: KVSpotifyAdminCredentials = {
      ...credentials,
      access_token: refreshedToken.access_token,
      access_token_obtained_at: now,
      access_token_expires_in: refreshedToken.expires_in,
    };

    // Store updated credentials back to KV
    await kv.put("spotify:admin:auth", JSON.stringify(updatedCredentials));

    return updatedCredentials;
  } catch (err) {
    console.error("Error getting Spotify credentials", err);
    return null;
  }
};
