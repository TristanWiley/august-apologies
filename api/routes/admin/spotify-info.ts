import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import z from "zod";
import { ErrorResponseSchema } from "../../types/endpoints";
import { contentJson, OpenAPIRoute } from "chanfana";

const AdminSpotifyInfoRouteResponseSchema = z.object({
  success: z.boolean(),
  data: z.boolean(),
});

export class AdminSpotifyInfoEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Check if Spotify admin authentication is set up",
    description:
      "Checks if the Spotify admin authentication token is stored and valid.",
    tags: ["Admin", "Spotify"],
    responses: {
      200: {
        description: "Authentication status retrieved successfully",
        ...contentJson(AdminSpotifyInfoRouteResponseSchema),
      },
      500: {
        description: "Internal server error",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  static handle = async (_request: IRequest, env: Env) => {
    const kv = env.PERMISSIONS_KV;

    try {
      const raw = await kv.get("spotify:admin:auth");
      if (!raw) {
        return generateJSONResponse({ success: true, data: false }, 200);
      }

      return generateJSONResponse({ success: true, data: true }, 200);
    } catch (err) {
      console.error(err);
      return generateJSONResponse(
        { message: "Failed to read stored permissions" },
        500,
      );
    }
  };
}
