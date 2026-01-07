import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils";

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";

export const spotifyAddTrackRoute = async (request: IRequest, env: Env) => {
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

    // Require playlist owner token to perform write
    if (!env.SPOTIFY_PLAYLIST_OWNER_TOKEN) {
      return generateJSONResponse(
        { message: "Server not configured to modify playlist" },
        501
      );
    }

    // Call Spotify API to add track
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SPOTIFY_PLAYLIST_OWNER_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      }
    );

    if (!res.ok) {
      console.error("spotify add track failed", await res.text());
      return generateJSONResponse(
        { message: "Failed to add track to playlist" },
        500
      );
    }

    return generateJSONResponse({ success: true }, 200);
  } catch (err) {
    console.error("spotifyAddTrackRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
