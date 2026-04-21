import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { DB } from "../../db";

export const isAdminRoute = async (request: IRequest, env: Env) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return generateJSONResponse({ message: "Missing sessionId" }, 400);
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
};
