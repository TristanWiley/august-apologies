import type { IRequest } from "itty-router";
import { DB } from "../../db";
import { generateJSONResponse } from "../../utils/utils";
import z from "zod";
import { OpenAPIRoute, contentJson } from "chanfana";
import { ErrorResponseSchema } from "../../types/endpoints";

const BanUserEndpointRequestSchema = z.object({
  twitchId: z.string(),
  action: z.enum(["ban", "unban"]),
  sessionId: z.string(),
});

const BanUserEndpointResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    twitchId: z.string(),
    displayName: z.string(),
    isBanned: z.boolean(),
  }),
});

export class BanUserEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Ban or unban a user",
    description: "Bans or unbans a user based on their Twitch ID.",
    tags: ["Admin", "Users"],
    request: {
      body: contentJson(BanUserEndpointRequestSchema),
    },
    responses: {
      200: {
        description: "User banned or unbanned successfully",
        ...contentJson(BanUserEndpointResponseSchema),
      },
      400: {
        description: "Bad request",
        ...contentJson(ErrorResponseSchema),
      },
      403: {
        description: "Unauthorized",
        ...contentJson(ErrorResponseSchema),
      },
      404: {
        description: "User not found",
        ...contentJson(ErrorResponseSchema),
      },
      500: {
        description: "Internal server error",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  static handle = async (request: IRequest, env: Env) => {
    try {
      const requestData = await request.json();
      const { twitchId, action, sessionId } = requestData as {
        twitchId: string;
        action: "ban" | "unban";
        sessionId: string;
      };

      if (!sessionId) {
        return generateJSONResponse({ message: "Missing sessionId" }, 400);
      }

      if (!twitchId) {
        return generateJSONResponse(
          { message: "Missing twitchId parameter" },
          400,
        );
      }

      if (!action || !["ban", "unban"].includes(action)) {
        return generateJSONResponse(
          { message: "Invalid action. Must be 'ban' or 'unban'" },
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

      let result;
      if (action === "ban") {
        result = await connection.banUser(twitchId);
      } else {
        result = await connection.unbanUser(twitchId);
      }

      if (!result) {
        return generateJSONResponse({ message: "User not found" }, 404);
      }

      return generateJSONResponse(
        {
          success: true,
          message: `User ${
            action === "ban" ? "banned" : "unbanned"
          } successfully`,
          data: {
            twitchId: result.twitch_id,
            displayName: result.display_name,
            isBanned: result.is_banned,
          },
        },
        200,
      );
    } catch (err) {
      console.error("banUserRoute error:", err);
      return generateJSONResponse({ message: "Internal server error" }, 500);
    }
  };
}
