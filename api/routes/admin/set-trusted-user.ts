import type { IRequest } from "itty-router";
import { DB } from "../../db";
import { generateJSONResponse } from "../../utils/utils";

export const setTrustedUserRoute = async (request: IRequest, env: Env) => {
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
      `User ${targetTwitchId} trusted status set to ${isTrusted} by ${account.display_name}`
    );

    return generateJSONResponse(
      {
        success: true,
        account: updatedAccount,
      },
      200
    );
  } catch (err) {
    console.error("setTrustedUserRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
