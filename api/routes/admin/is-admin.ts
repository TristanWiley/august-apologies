import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { DB } from "../../db";

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

export const isAdminRoute = async (request: IRequest, env: Env) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

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
};
