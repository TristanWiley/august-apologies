import type { IRequest } from "itty-router";
import { DB } from "../../db";
import { generateJSONResponse } from "../../utils/utils";
import {
  clearSpotifyPlaylistCache,
  clearSpotifyOwnershipCache,
} from "../../utils/cache";
import { ErrorResponseSchema } from "../../types/endpoints";
import { OpenAPIRoute, contentJson } from "chanfana";
import z from "zod";

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";

const ClearCacheEndpointRequestSchema = z.object({
  sessionId: z.string(),
  cacheType: z.enum(["playlist", "ownership", "all"]),
});

const ClearCacheEndpointResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  clearedCaches: z.array(z.enum(["playlist", "ownership"])),
});

export class ClearCacheEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Clear cache for Spotify data",
    description: "Clears the cache for Spotify playlist or ownership data.",
    tags: ["Admin", "Spotify"],
    request: {
      body: contentJson(ClearCacheEndpointRequestSchema),
    },
    responses: {
      200: {
        description: "Cache cleared successfully",
        ...contentJson(ClearCacheEndpointResponseSchema),
      },
      400: {
        description: "Bad request",
        ...contentJson(ErrorResponseSchema),
      },
      403: {
        description: "Unauthorized",
        ...contentJson(ErrorResponseSchema),
      },
      500: {
        description: "Internal server error",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(request: IRequest, env: Env) {
    try {
      const requestData = await request.json();
      const { sessionId, cacheType } = requestData as {
        sessionId: string;
        cacheType: "playlist" | "ownership" | "all";
      };

      if (!sessionId) {
        return generateJSONResponse({ message: "Missing sessionId" }, 400);
      }

      if (!cacheType || !["playlist", "ownership", "all"].includes(cacheType)) {
        return generateJSONResponse(
          {
            message:
              "Invalid cacheType. Must be 'playlist', 'ownership', or 'all'",
          },
          400,
        );
      }

      const connection = new DB(env);

      // Verify user is admin
      const adminUser = await connection.getAccountBySession(sessionId);
      if (!adminUser || !adminUser.is_owner) {
        return generateJSONResponse(
          { message: "Unauthorized. Admin privileges required." },
          403,
        );
      }

      // Clear requested cache(s)
      const clearedCaches = [];

      if (cacheType === "playlist" || cacheType === "all") {
        await clearSpotifyPlaylistCache(PLAYLIST_ID, env);
        clearedCaches.push("playlist");
      }

      if (cacheType === "ownership" || cacheType === "all") {
        await clearSpotifyOwnershipCache(env);
        clearedCaches.push("ownership");
      }

      return generateJSONResponse(
        {
          success: true,
          message: `Cleared cache for: ${clearedCaches.join(", ")}`,
          clearedCaches,
        },
        200,
      );
    } catch (err) {
      console.error("clearCacheRoute error:", err);
      return generateJSONResponse({ message: "Internal server error" }, 500);
    }
  }
}
