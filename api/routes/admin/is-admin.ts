import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { DB } from "../../db";
import z from "zod";
import { contentJson, OpenAPIRoute } from "chanfana";

const IsAdminEndpointRequestSchema = z.object({
  sessionId: z.string(),
});

const IsAdminEndpointResponseSchema = z.object({
  isAdmin: z.boolean(),
  message: z.string(),
});

export const isAdmin = async (
  sessionId: string,
  env: Env,
): Promise<boolean> => {
  try {
    const connection = new DB(env);
    const adminUser = await connection.getAccountBySession(sessionId);
    return !!adminUser?.is_owner;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export class IsAdminEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Check if a user is an admin",
    description:
      "Checks if the user associated with the given session ID is an admin.",
    tags: ["Admin"],
    request: {
      query: IsAdminEndpointRequestSchema,
    },
    response: {
      ...contentJson(IsAdminEndpointResponseSchema),
    },
  };

  async handle(_: IRequest, env: Env): Promise<Response> {
    try {
      const data = await this.getValidatedData<typeof this.schema>();

      const sessionId = data.query.sessionId;

      if (!sessionId) {
        return generateJSONResponse({ message: "Missing sessionId" }, 400);
      }

      const adminUser = await isAdmin(sessionId, env);

      if (!adminUser) {
        return generateJSONResponse(
          { message: "Unauthorized. Admin privileges required." },
          403,
        );
      }

      return generateJSONResponse(
        { isAdmin: true, message: "User is admin" },
        200,
      );
    } catch (error) {
      console.error("Error in isAdminRoute:", error);
      return generateJSONResponse(
        { isAdmin: false, message: "Internal server error" },
        500,
      );
    }
  }
}
