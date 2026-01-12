import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse, getSpotifyCredentials } from "../utils/utils";
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import {
  clearSpotifyPlaylistCache,
  clearSpotifyOwnershipCache,
} from "../utils/cache";

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";

// Helper to convert Spotify URL to track URI
function parseSpotifyTrackId(input: string): string | null {
  // Handle spotify:track:xxx format
  if (input.startsWith("spotify:track:")) {
    return input;
  }

  // Handle https://open.spotify.com/track/xxx format
  const match = input.match(/track\/([a-zA-Z0-9]+)/);
  if (match) {
    return `spotify:track:${match[1]}`;
  }

  return null;
}

// Helper to get valid Spotify client with token refresh
async function getSpotifyClient(env: Env): Promise<SpotifyApi | null> {
  try {
    // Get credentials from KV
    const credentials = await getSpotifyCredentials(env);
    if (!credentials || !credentials.access_token) {
      console.error("Failed to get Spotify credentials from KV");
      return null;
    }

    // Use the access token from credentials
    const spotifyClient = SpotifyApi.withAccessToken(credentials.client_id, {
      access_token: credentials.access_token,
      token_type: "Bearer",
      expires_in: credentials.access_token_expires_in || 3600,
    } as AccessToken);

    return spotifyClient;
  } catch (err) {
    console.error("Failed to get Spotify client:", err);
    return null;
  }
}

export const spotifyRemoveTrackRoute = async (request: IRequest, env: Env) => {
  try {
    const body = await request.json();
    const { sessionId, trackUri } = body as {
      sessionId?: string;
      trackUri?: string;
    };

    // Validate input
    if (!sessionId || !trackUri) {
      return generateJSONResponse({ message: "Missing params" }, 400);
    }

    // Parse track URI - accept both spotify:track: and URLs
    const parsedTrackUri = parseSpotifyTrackId(trackUri.trim());
    if (!parsedTrackUri) {
      return generateJSONResponse({ message: "Invalid track URI or URL" }, 400);
    }

    // Extract track ID from URI to validate format
    const trackIdMatch = parsedTrackUri.match(/spotify:track:([a-zA-Z0-9]+)/);
    if (!trackIdMatch) {
      return generateJSONResponse({ message: "Invalid track URI format" }, 400);
    }

    // Verify user session and subscriber status
    const db = new DB(env);
    const account = await db.getAccountBySession(sessionId);
    if (!account) {
      return generateJSONResponse({ message: "Invalid session" }, 401);
    }
    if (!account.is_subscriber) {
      return generateJSONResponse({ message: "Subscriber-only" }, 403);
    }

    // Verify the user owns this track
    const ownsTrack = await db.isTrackOwnedByUser(
      parsedTrackUri,
      account.twitch_id
    );
    if (!ownsTrack) {
      return generateJSONResponse(
        { message: "You can only remove tracks you added" },
        403
      );
    }

    // Get Spotify client
    const spotifyClient = await getSpotifyClient(env);
    if (!spotifyClient) {
      return generateJSONResponse(
        { message: "Failed to initialize Spotify client" },
        500
      );
    }

    // Remove track from playlist
    await spotifyClient.playlists.removeItemsFromPlaylist(PLAYLIST_ID, {
      tracks: [{ uri: parsedTrackUri }],
    });

    // Remove from database
    await db.removePlaylistEntry(parsedTrackUri);

    // Clear caches to force refresh
    await clearSpotifyPlaylistCache(PLAYLIST_ID, env);
    await clearSpotifyOwnershipCache(env);

    console.log(
      `Track ${parsedTrackUri} removed from playlist by ${account.display_name} (${account.twitch_id})`
    );

    return generateJSONResponse({ success: true }, 200);
  } catch (err) {
    console.error("spotifyRemoveTrackRoute error:", err);

    // Check for specific Spotify API errors
    if (err instanceof Error) {
      if (err.message.includes("not found")) {
        return generateJSONResponse(
          { message: "Track or playlist not found" },
          404
        );
      }
    }

    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
