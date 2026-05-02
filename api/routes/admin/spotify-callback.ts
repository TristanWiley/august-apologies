import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { type AccessToken } from "@spotify/web-api-ts-sdk";
import { isAdmin } from "./is-admin";
import { contentJson, OpenAPIRoute } from "chanfana";
import z from "zod";
import { ErrorResponseSchema } from "../../types/endpoints";

const AdminSpotifyCallbackRequestSchema = z.object({
  code: z.string(),
  redirectURL: z.string().url(),
  sessionId: z.string(),
});

const AdminSpotifyCallbackResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    expiresIn: z.number(),
  }),
});

export class AdminSpotifyCallbackEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Spotify OAuth callback for admin authentication",
    description:
      "Handles the Spotify OAuth callback and stores the access token for admin use.",
    tags: ["Admin", "Spotify"],
    request: {
      body: contentJson(AdminSpotifyCallbackRequestSchema),
    },
    responses: {
      200: {
        description: "Successful authentication",
        ...contentJson(AdminSpotifyCallbackResponseSchema),
      },
      400: {
        description: "Bad request",
        ...contentJson(ErrorResponseSchema),
      },
      403: {
        description: "Unauthorized",
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
    const { code, redirectURL, sessionId } = requestData as {
      code?: string;
      redirectURL?: string;
      sessionId?: string;
    };

    if (!sessionId) {
      return generateJSONResponse({ message: "No session ID provided" }, 400);
    }

    if (!code) {
      return generateJSONResponse(
        { message: "No Spotify auth code provided" },
        400,
      );
    }
    if (!redirectURL) {
      return generateJSONResponse({ message: "No redirect URL provided" }, 400);
    }

    if (!(await isAdmin(sessionId, env))) {
      return generateJSONResponse({ message: "Unauthorized" }, 403);
    }

    // Exchange code for token
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
          ).toBase64()}`,
        },
        body: new URLSearchParams({
          code,
          redirect_uri: redirectURL,
          grant_type: "authorization_code",
        }),
      },
    );

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      console.error("Failed to get admin spotify token", text);
      return generateJSONResponse(
        { message: "Failed to get Spotify token" },
        500,
      );
    }

    const response = (await tokenResponse.json()) as AccessToken;

    const kv = env.PERMISSIONS_KV;

    try {
      await kv.put("spotify:admin:auth", JSON.stringify(response));
    } catch (err) {
      console.error("Failed to write admin spotify auth to KV", err);
      return generateJSONResponse({ message: "Failed to persist tokens" }, 500);
    }

    return generateJSONResponse(
      { success: true, data: { expiresIn: response.expires_in } },
      200,
    );
  }
}
