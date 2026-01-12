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

export const spotifyAddTrackRoute = async (
  request: IRequest,
  env: Env,
  ctx: ExecutionContext
) => {
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

    // Verify user session and subscriber status
    const db = new DB(env);
    const account = await db.getAccountBySession(sessionId);
    if (!account) {
      return generateJSONResponse({ message: "Invalid session" }, 401);
    }
    if (!account.is_subscriber) {
      return generateJSONResponse({ message: "Subscriber-only" }, 403);
    }

    // Determine daily limit based on subscription tier
    let dailyLimit = 5; // Default for tier 1
    if (account.subscription_type === "2000") {
      dailyLimit = 10; // Tier 2
    } else if (account.subscription_type === "3000") {
      dailyLimit = 20; // Tier 3
    }

    // Check daily song limit
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const limitKey = `song_limit:${account.twitch_id}:${today}`;
    const currentCount = await env.CACHE_KV.get(limitKey);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    console.log(
      `User ${account.display_name} (${account.twitch_id}) has added ${count}/${dailyLimit} songs today`
    );

    if (count >= dailyLimit) {
      return generateJSONResponse(
        {
          message: `Daily limit reached. You can add up to ${dailyLimit} songs per day.`,
        },
        429
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

    // Add track to playlist
    await spotifyClient.playlists.addItemsToPlaylist(PLAYLIST_ID, [
      parsedTrackUri,
    ]);

    // Store ownership data
    await db.addPlaylistEntry(parsedTrackUri, account.twitch_id);

    // Increment daily song count
    await env.CACHE_KV.put(limitKey, String(count + 1), {
      expirationTtl: 86400 * 2, // 48 hours to handle timezone edge cases
    });

    // Clear caches immediately to force refresh
    await clearSpotifyPlaylistCache(PLAYLIST_ID, env);
    await clearSpotifyOwnershipCache(env);

    // Get track details for Discord webhook
    const trackId = parsedTrackUri.replace("spotify:track:", "");
    const trackDetails = await spotifyClient.tracks.get(trackId);

    // Send Discord webhook notification with waitUntil
    const artists = trackDetails.artists.map((a) => a.name).join(", ");
    const discordMessage = {
      embeds: [
        {
          title: trackDetails.name,
          description: `Added by @${account.display_name}`,
          fields: [
            {
              name: "Artist",
              value: artists,
              inline: false,
            },
            {
              name: "Album",
              value: trackDetails.album.name,
              inline: false,
            },
          ],
          url: trackDetails.external_urls.spotify,
          color: 0x1db954, // Spotify green
        },
      ],
    };

    ctx.waitUntil(
      fetch(env.PLAYLIST_DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordMessage),
      }).catch((webhookErr) => {
        console.error("Failed to send Discord webhook:", webhookErr);
      })
    );

    console.log(
      `Track ${parsedTrackUri} added to playlist by ${account.display_name} (${account.twitch_id})`
    );

    return generateJSONResponse({ success: true }, 200);
  } catch (err) {
    console.error("spotifyAddTrackRoute error:", err);

    // Check for specific Spotify API errors
    if (err instanceof Error) {
      if (err.message.includes("duplicate")) {
        return generateJSONResponse(
          { message: "Track already in playlist" },
          409
        );
      }
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
