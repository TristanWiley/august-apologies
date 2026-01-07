import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils";

export const adminTwitchInfoRoute = async (_request: IRequest, env: Env) => {
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
      500
    );
  }
};
