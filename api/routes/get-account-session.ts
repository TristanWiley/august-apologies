import type { IRequest } from "itty-router";
import { DB } from "../db";
import { generateJSONResponse } from "../utils/utils";
import z from "zod";
import { contentJson, OpenAPIRoute } from "chanfana";

const GetAccountSessionEndpointRequestSchema = z.object({
  query: z.object({
    sessionId: z.uuid(),
  }),
});

const GetAccountSessionEndpointResponseSchema = z.object({
  success: z.boolean(),
  account: z.object({
    is_subscriber: z.boolean(),
    twitch_id: z.string(),
    is_owner: z.boolean(),
  }),
});

export class GetAccountSessionEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get account session",
    description: "Retrieve the account associated with a given session ID.",
    tags: ["Accounts"],
    request: {
      query: GetAccountSessionEndpointRequestSchema.shape.query,
    },
    responses: {
      200: {
        description: "Success",
        ...contentJson(GetAccountSessionEndpointResponseSchema),
      },
    },
  };

  async handle(request: IRequest, env: Env) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId)
        return generateJSONResponse({ message: "No sessionId provided" }, 400);

      const connection = new DB(env);
      const account = await connection.getAccountBySession(sessionId);
      if (!account) return generateJSONResponse({ message: "Not found" }, 404);

      const accountData = {
        is_subscriber: account.is_subscriber,
        twitch_id: account.twitch_id,
        is_owner: account.is_owner,
      };

      // Check if user is banned
      if (account.is_banned) {
        return generateJSONResponse(
          {
            message:
              "Your account has been banned and cannot access this service.",
          },
          403,
        );
      }

      return generateJSONResponse({ success: true, account: accountData }, 200);
    } catch (err) {
      console.error("getAccountSessionRoute error:", err);
      return generateJSONResponse({ message: "Internal server error" }, 500);
    }
  }
}
