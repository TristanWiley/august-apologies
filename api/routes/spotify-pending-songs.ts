import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils/utils";

export const spotifyPendingSongsRoute = async (request: IRequest, env: Env) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    // Validate input
    if (!sessionId) {
      return generateJSONResponse({ message: "Missing sessionId" }, 400);
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

    // Get pending songs
    const pendingSongs = await db.getPendingSongs();

    return generateJSONResponse({ pendingSongs }, 200);
  } catch (err) {
    console.error("spotifyPendingSongsRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
