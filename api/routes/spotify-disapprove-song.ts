import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils/utils";
import { OpenAPIRoute, contentJson } from "chanfana";
import z from "zod";

const SpotifyDisapproveSongEndpointRequestSchema = z.object({
  sessionId: z.uuid(),
  spotifyId: z.uuid(),
});

const SpotifyDisapproveSongEndpointResponseSchema = z.object({
  success: z.boolean(),
});

export class SpotifyDisapproveSongEndpoint extends OpenAPIRoute {
  static schema = {
    summary: "Disapprove a pending Spotify song",
    description:
      "Disapprove a song that is currently pending and remove it from the pending list.",
    tags: ["Spotify"],
    request: {
      body: SpotifyDisapproveSongEndpointRequestSchema,
    },
    responses: {
      200: {
        description: "Song disapproved and removed from pending",
        ...contentJson(SpotifyDisapproveSongEndpointResponseSchema),
      },
    },
  };

  static handle = async (request: IRequest, env: Env) => {
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
        `Track ${spotifyId} disapproved and removed from pending by ${account.display_name}`,
      );

      return generateJSONResponse({ success: true }, 200);
    } catch (err) {
      console.error("spotifyDisapproveSongRoute error:", err);
      return generateJSONResponse({ message: "Internal server error" }, 500);
    }
  };
}
