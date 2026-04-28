import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";

export const adminSpotifyInfoRoute = async (_request: IRequest, env: Env) => {
  const kv = env.PERMISSIONS_KV;

  try {
    const raw = await kv.get("spotify:admin:auth");
    if (!raw) {
      return generateJSONResponse({ success: true, data: false }, 200);
    }

    return generateJSONResponse({ success: true, data: true }, 200);
  } catch (err) {
    console.error(err);
    return generateJSONResponse(
      { message: "Failed to read stored permissions" },
      500,
    );
  }
};
