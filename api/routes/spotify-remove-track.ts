import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils";

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";

export const spotifyRemoveTrackRoute = async (request: IRequest, env: Env) => {
  try {
    const body = await request.json();
    const { sessionId, trackUri } = body as {
      sessionId?: string;
      trackUri?: string;
    };
    if (!sessionId || !trackUri)
      return generateJSONResponse({ message: "Missing params" }, 400);

    const connection = new DB(env);
    const account = await connection.getAccountBySession(sessionId);
    if (!account)
      return generateJSONResponse({ message: "Invalid session" }, 401);
    if (!account.is_subscriber)
      return generateJSONResponse({ message: "Subscriber-only" }, 403);

    if (!env.SPOTIFY_PLAYLIST_OWNER_TOKEN) {
      return generateJSONResponse(
        { message: "Server not configured to modify playlist" },
        501
      );
    }

    // Spotify remove tracks
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${env.SPOTIFY_PLAYLIST_OWNER_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
      }
    );

    if (!res.ok) {
      console.error("spotify remove track failed", await res.text());
      return generateJSONResponse(
        { message: "Failed to remove track from playlist" },
        500
      );
    }

    return generateJSONResponse({ success: true }, 200);
  } catch (err) {
    console.error("spotifyRemoveTrackRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
