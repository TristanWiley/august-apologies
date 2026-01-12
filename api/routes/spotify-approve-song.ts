import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse, getSpotifyCredentials } from "../utils/utils";
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import {
  clearSpotifyPlaylistCache,
  clearSpotifyOwnershipCache,
} from "../utils/cache";

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";

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

export const spotifyApproveSongRoute = async (
  request: IRequest,
  env: Env,
  ctx: ExecutionContext
) => {
  try {
    const body = await request.json();
    const { sessionId, spotifyId } = body as {
      sessionId?: string;
      spotifyId?: string;
    };

    // Validate input
    if (!sessionId || !spotifyId) {
      return generateJSONResponse({ message: "Missing params" }, 400);
    }

    // Verify user session and owner status
    const db = new DB(env);
    const account = await db.getAccountBySession(sessionId);
    if (!account) {
      return generateJSONResponse({ message: "Invalid session" }, 401);
    }
    if (!account.is_owner) {
      return generateJSONResponse({ message: "Owner-only" }, 403);
    }

    // Get pending song details
    const pendingSongs = await db.getPendingSongs();
    const pendingSong = pendingSongs.find((s) => s.spotify_id === spotifyId);

    if (!pendingSong) {
      return generateJSONResponse(
        { message: "Song not found in pending list" },
        404
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
    await spotifyClient.playlists.addItemsToPlaylist(PLAYLIST_ID, [spotifyId]);

    // Store ownership data
    await db.addPlaylistEntry(spotifyId, pendingSong.added_by_twitch_id);

    // Remove from pending
    await db.removePendingSong(spotifyId);

    // Clear caches immediately to force refresh
    await clearSpotifyPlaylistCache(PLAYLIST_ID, env);
    await clearSpotifyOwnershipCache(env);

    // Send Discord webhook notification with waitUntil
    const discordMessage = {
      embeds: [
        {
          title: pendingSong.track_name,
          description: `Added by @${pendingSong.added_by_display_name} (approved by @${account.display_name})`,
          fields: [
            {
              name: "Artist",
              value: pendingSong.track_artists,
              inline: false,
            },
            ...(pendingSong.track_album
              ? [
                  {
                    name: "Album",
                    value: pendingSong.track_album,
                    inline: false,
                  },
                ]
              : []),
          ],
          url: pendingSong.external_url || undefined,
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
      `Track ${spotifyId} approved and added to playlist by ${account.display_name}`
    );

    return generateJSONResponse({ success: true }, 200);
  } catch (err) {
    console.error("spotifyApproveSongRoute error:", err);

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
