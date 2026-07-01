import { SpotifyApi } from "@tristanwiley/spotify-web-api-ts-sdk";
import type { PowerUpRedemptionWebhookPayload } from "../../types/twitch";
import { getAdminSpotifyCredentials } from "../../utils/spotify";
import { generateJSONResponse } from "../../utils/utils";

const SAMPLE_POWER_UP_REDEMPTION = {
  subscription: {
    id: "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
    type: "channel.custom_power_up_redemption.add",
    version: "1",
    status: "enabled",
    cost: 0,
    condition: {
      broadcaster_user_id: "1337",
      reward_id: "92af127c-7326-4483-a52b-b0da0be61c01", // optional; gets notifications for a specific Power-up
    },
    transport: {
      method: "webhook",
      callback: "https://example.com/webhooks/callback",
    },
    created_at: "2026-05-01T10:11:12.634234626Z",
  },
  event: {
    id: "17fa2df1-ad76-4804-bfa5-a40ef63efe63",
    broadcaster_user_id: "1337",
    broadcaster_user_login: "cool_user",
    broadcaster_user_name: "Cool_User",
    user_id: "9001",
    user_login: "cooler_user",
    user_name: "Cooler_User",
    user_input: "pogchamp",
    status: "unfulfilled",
    custom_power_up: {
      id: "92af127c-7326-4483-a52b-b0da0be61c01",
      title: "title",
      bits: 100,
      prompt: "Power-up prompt",
    },
    redeemed_at: "2026-05-01T17:16:03.17106713Z",
  },
};

export const PowerUpRedemptionHandler = async (
  payload: PowerUpRedemptionWebhookPayload,
  env: Env,
) => {
  console.info("New Power Up Redemption", payload);

  const { event } = payload;

  // const isProd = event.broadcaster_user_id === "194331558";

  // if (!isProd) {
  //   console.info("This is not prod");
  //   return;
  // }

  const credentials = await getAdminSpotifyCredentials(env);

  if (!credentials) {
    return generateJSONResponse(
      { message: "Spotify credentials not configured" },
      500,
    );
  }

  if (event.custom_power_up.id !== "52f878b7-a65c-43e9-8019-5020ed01e9ab") {
    return;
  }

  const spotifyClient = SpotifyApi.withAccessToken(
    env.SPOTIFY_CLIENT_ID,
    credentials,
  );

  console.info(
    "Mock: Player Skip",
    (await spotifyClient.currentUser.profile()).display_name,
  );
  // await spotifyClient.player.skipToNext("");
};
