import { SpotifyApi } from "@tristanwiley/spotify-web-api-ts-sdk";
import type { PowerUpRedemptionWebhookPayload } from "../../types/twitch";
import { getAdminSpotifyCredentials } from "../../utils/spotify";
import { generateJSONResponse } from "../../utils/utils";

export const PowerUpRedemptionHandler = async (
  payload: PowerUpRedemptionWebhookPayload,
  env: Env,
) => {
  console.info("New Power Up Redemption", payload);

  try {
    const { event } = payload;

    const credentials = await getAdminSpotifyCredentials(env);

    if (!credentials) {
      return generateJSONResponse(
        { message: "Spotify credentials not configured" },
        500,
      );
    }

    if (event.custom_power_up.id !== env.SKIP_SONG_REWARD_ID) {
      return;
    }

    const spotifyClient = SpotifyApi.withAccessToken(
      env.SPOTIFY_CLIENT_ID,
      credentials,
    );

    await spotifyClient.player.skipToNext();
  } catch (err) {
    console.error("Failed to redeem power up", err);
  }
};
