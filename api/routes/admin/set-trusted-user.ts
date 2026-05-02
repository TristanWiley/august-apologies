import type { IRequest } from "itty-router";
import { DB } from "../../db";
import { generateJSONResponse } from "../../utils/utils";
import z from "zod";
import { contentJson, OpenAPIRoute } from "chanfana";
import { ErrorResponseSchema } from "../../types/endpoints";

const SetTrustedUserEndpointRequestSchema = z.object({
  sessionId: z.string(),
  targetTwitchId: z.string(),
  isTrusted: z.boolean(),
});

const SetTrustedUserEndpointResponseSchema = z.object({
  success: z.boolean(),
  account: z.object({
    twitch_id: z.string(),
    display_name: z.string(),
    is_owner: z.boolean(),
    is_trusted: z.boolean(),
  }),
});

export class SetTrustedUserEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Set or unset a trusted user",
    description:
      "Allows the owner to set or unset a trusted user by their Twitch ID.",
    tags: ["Admin"],
    request: {
      body: contentJson(SetTrustedUserEndpointRequestSchema),
    },
    responses: {
      200: {
        description: "Trusted user status updated successfully",
        ...contentJson(SetTrustedUserEndpointResponseSchema),
      },
      400: {
        description: "Bad request",
        ...contentJson(ErrorResponseSchema),
      },
      401: {
        description: "Unauthorized",
        ...contentJson(ErrorResponseSchema),
      },
      403: {
        description: "Forbidden",
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
      const body = await request.json();
      const { sessionId, targetTwitchId, isTrusted } = body as {
        sessionId?: string;
        targetTwitchId?: string;
        isTrusted?: boolean;
      };

      // Validate input
      if (!sessionId || !targetTwitchId || typeof isTrusted !== "boolean") {
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

      // Set trusted status
      const updatedAccount = await db.setTrustedUser(targetTwitchId, isTrusted);

      if (!updatedAccount) {
        return generateJSONResponse({ message: "User not found" }, 404);
      }

      console.log(
        `User ${targetTwitchId} trusted status set to ${isTrusted} by ${account.display_name}`,
      );

      return generateJSONResponse(
        {
          success: true,
          account: updatedAccount,
        },
        200,
      );
    } catch (err) {
      console.error("setTrustedUserRoute error:", err);
      return generateJSONResponse({ message: "Internal server error" }, 500);
    }
  };
}
