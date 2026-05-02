import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import type { TwitchOAuthTokenResponse } from "../../types/twitch";
import { TwitchApi } from "ts-twitch-api";
import { contentJson, OpenAPIRoute } from "chanfana";
import z from "zod";
import { ErrorResponseSchema } from "../../types/endpoints";

const AdminTwitchCallbackEndpointRequestSchema = z.object({
  code: z.string(),
  redirectURL: z.string(),
});

const AdminTwitchCallbackEndpointResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    display_name: z.string(),
  }),
});

export class AdminTwitchCallbackEndpoint extends OpenAPIRoute {
  schema = {
    tags: ["Admin"],
    summary: "Handle Twitch OAuth callback for admin authentication",
    request: {
      body: contentJson(AdminTwitchCallbackEndpointRequestSchema),
    },
    responses: {
      200: {
        description: "Successfully authenticated with Twitch",
        ...contentJson(AdminTwitchCallbackEndpointResponseSchema),
      },
      400: {
        description: "Bad request, missing code or redirectURL",
        ...contentJson(ErrorResponseSchema),
      },
      403: {
        description: "Unauthorized, not the channel owner",
        ...contentJson(ErrorResponseSchema),
      },
      500: {
        description: "Internal server error",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(request: IRequest, env: Env): Promise<Response> {
    const requestData = await request.json();
    const { code, redirectURL } = requestData as {
      code?: string;
      redirectURL?: string;
    };

    if (!code) {
      return generateJSONResponse(
        { message: "No Twitch auth code provided" },
        400,
      );
    }
    if (!redirectURL) {
      return generateJSONResponse({ message: "No redirect URL provided" }, 400);
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectURL,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      console.error("Failed to get admin twitch token", text);
      return generateJSONResponse(
        { message: "Failed to get Twitch token" },
        500,
      );
    }

    const tokenJson = (await tokenResponse.json()) as TwitchOAuthTokenResponse;
    const { access_token, refresh_token, expires_in, scope } = tokenJson;

    // Get user info for the token to identify broadcaster
    const api = new TwitchApi({
      clientId: env.TWITCH_CLIENT_ID,
      accessToken: access_token,
    });
    const userRes = await api.users.getUsers();

    if (!userRes.ok) {
      console.error(
        "Failed to get Twitch user info for admin token",
        await userRes.data,
      );
      return generateJSONResponse(
        { message: "Failed to get Twitch user info" },
        500,
      );
    }

    const user = (userRes.data.data || [])[0];

    if (!user || !user.id) {
      return generateJSONResponse(
        { message: "Failed to identify broadcaster" },
        500,
      );
    }

    const stored = {
      access_token,
      refresh_token,
      expires_in,
      scope,
      id: user.id,
      display_name: user.display_name,
      obtained_at: Date.now(),
    };

    if (user.id !== "194331558") {
      console.error("Unauthorized: not the channel owner", user.id, stored);
      return generateJSONResponse(
        { message: "Unauthorized: not the channel owner" },
        403,
      );
    }

    const kv = env.PERMISSIONS_KV;

    try {
      await kv.put("twitch:admin:auth", JSON.stringify(stored));
    } catch (err) {
      console.error("Failed to write admin twitch auth to KV", err);
      return generateJSONResponse({ message: "Failed to persist tokens" }, 500);
    }

    return generateJSONResponse(
      { success: true, data: { id: user.id, display_name: user.display_name } },
      200,
    );
  }
}
