import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../utils";
import type { TwitchHelixStreamsResponse } from "../types/twitch";

export const twitchStatusRoute = async (_request: IRequest, env: Env) => {
  try {
    // Get an app access token
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      return generateJSONResponse(
        { message: "Failed to get Twitch app token" },
        500
      );
    }

    const tokenJSON = (await tokenRes.json()) as { access_token?: string };
    const access_token = tokenJSON.access_token;

    if (!access_token) {
      return generateJSONResponse(
        { message: "No access token received from Twitch" },
        500
      );
    }

    const streamRes = await fetch(
      "https://api.twitch.tv/helix/streams?user_login=august",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Client-Id": env.TWITCH_CLIENT_ID,
        },
      }
    );

    if (!streamRes.ok) {
      return generateJSONResponse(
        { message: "Failed to fetch Twitch stream status" },
        500
      );
    }

    const streamJSON = (await streamRes.json()) as TwitchHelixStreamsResponse;

    const isLive = Array.isArray(streamJSON.data) && streamJSON.data.length > 0;
    const streamData = isLive ? streamJSON.data[0] : null;

    return generateJSONResponse(
      {
        live: isLive,
        title: streamData?.title || null,
        viewer_count: streamData?.viewer_count || null,
        started_at: streamData?.started_at || null,
      },
      200
    );
  } catch (err) {
    console.error("twitchStatusRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
