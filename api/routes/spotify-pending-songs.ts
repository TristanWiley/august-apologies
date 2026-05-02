import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils/utils";
import z from "zod";
import { OpenAPIRoute, contentJson } from "chanfana";

const SpotifyPendingSongsEndpointResponseSchema = z.object({
  pendingSongs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      artist: z.string(),
      album: z.string(),
      coverUrl: z.string().url(),
    }),
  ),
});

const SpotifyPendingSongsEndpointRequestSchema = z.object({
  sessionId: z.uuid(),
});

export class SpotifyPendingSongsEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get pending songs",
    description: "Get a list of all pending songs in the system.",
    tags: ["Spotify"],
    request: {
      query: SpotifyPendingSongsEndpointRequestSchema,
    },
    responses: {
      200: {
        description: "List of pending songs",
        ...contentJson(SpotifyPendingSongsEndpointResponseSchema),
      },
    },
  };

  async handle(request: IRequest, env: Env) {
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
  }
}
