import type { IRequest } from "itty-router";
import { DB } from "../../db";
import { generateJSONResponse } from "../../utils/utils";

export const banUserRoute = async (request: IRequest, env: Env) => {
  try {
    const requestData = await request.json();
    const { twitchId, action } = requestData as {
      twitchId: string;
      action: "ban" | "unban";
    };

    if (!twitchId) {
      return generateJSONResponse(
        { message: "Missing twitchId parameter" },
        400
      );
    }

    if (!action || !["ban", "unban"].includes(action)) {
      return generateJSONResponse(
        { message: "Invalid action. Must be 'ban' or 'unban'" },
        400
      );
    }

    const connection = new DB(env);

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
      200
    );
  } catch (err) {
    console.error("banUserRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
