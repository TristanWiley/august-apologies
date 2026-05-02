import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { contentJson, OpenAPIRoute } from "chanfana";
import z from "zod";
import { ErrorResponseSchema } from "../../types/endpoints";

const AdminTwitchInfoEndpointResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({
      id: z.string(),
      display_name: z.string(),
      scope: z.array(z.string()),
      obtained_at: z.number(),
    })
    .nullable(),
});

export class AdminTwitchInfoEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get Twitch admin authentication information",
    description:
      "Returns the Twitch admin authentication information if available. This is used to verify if the admin is authenticated and to display relevant info in the admin dashboard.",
    tags: ["Admin", "Twitch"],
    responses: {
      200: {
        description: "Successful response with Twitch admin info",
        ...contentJson(AdminTwitchInfoEndpointResponseSchema),
      },
      500: {
        description: "Internal server error",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(_request: IRequest, env: Env) {
    const kv = env.PERMISSIONS_KV;

    try {
      const raw = await kv.get("twitch:admin:auth");
      if (!raw) {
        return generateJSONResponse({ success: true, data: null }, 200);
      }

      const parsed = JSON.parse(raw);

      // Don't return raw tokens — mask them
      const masked = {
        id: parsed.id,
        display_name: parsed.display_name,
        scope: parsed.scope,
        obtained_at: parsed.obtained_at,
      };

      return generateJSONResponse({ success: true, data: masked }, 200);
    } catch (err) {
      console.error(err);
      return generateJSONResponse(
        { message: "Failed to read stored permissions" },
        500,
      );
    }
  }
}
