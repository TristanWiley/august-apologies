import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../utils/utils";
import {
  getStoredSpotifyOwnership,
  storeSpotifyOwnership,
} from "../utils/cache";
import { DB } from "../db";
import { SpotifyOwnershipSchema } from "../types/db";
import { contentJson, OpenAPIRoute } from "chanfana";
import { ErrorResponseSchema } from "../types/endpoints";
import z from "zod";

const SpotifyOwnershipEndpointResponseSchema = z.object({
  ownership: SpotifyOwnershipSchema,
  cached: z.boolean(),
});

// Gets the Spotify tracks and ownership info for the playlist from the DB
export class SpotifyOwnershipEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get Spotify ownership information",
    description: "Returns the ownership information for all Spotify playlists.",
    tags: ["Spotify"],
    responses: {
      200: {
        description: "Successful response with ownership data",
        ...contentJson(SpotifyOwnershipEndpointResponseSchema),
      },
      500: {
        description: "Internal server error",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(_request: IRequest, env: Env) {
    try {
      // First check the cache
      const cachedOwnership = await getStoredSpotifyOwnership();
      if (cachedOwnership) {
        console.log("Using cached Spotify ownership data");
        return generateJSONResponse(
          { ownership: cachedOwnership, cached: true },
          200,
        );
      }

      console.log("Ownership cache miss, fetching from DB");
      // If not cached, fetch from the database
      const connection = new DB(env);
      const ownershipData = await connection.getAllPlaylistOwnerships();

      // Update cache
      await storeSpotifyOwnership(ownershipData);
      console.log("Stored ownership data in cache with tag");

      return generateJSONResponse(
        { ownership: ownershipData, cached: false },
        200,
      );
    } catch (error) {
      console.error("Error in SpotifyOwnershipEndpoint:", error);
      return generateJSONResponse(
        { message: "Failed to retrieve Spotify ownership data" },
        500,
      );
    }
  }
}
