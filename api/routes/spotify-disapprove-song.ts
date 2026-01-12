import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils/utils";

export const spotifyDisapproveSongRoute = async (
  request: IRequest,
  env: Env
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

    // Remove from pending songs
    await db.removePendingSong(spotifyId);

    console.log(
      `Track ${spotifyId} disapproved and removed from pending by ${account.display_name}`
    );

    return generateJSONResponse({ success: true }, 200);
  } catch (err) {
    console.error("spotifyDisapproveSongRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
