import {
  SpotifyApi,
  type AccessToken,
} from "@tristanwiley/spotify-web-api-ts-sdk";

export const createSpotifyApiClient = (
  clientId: string,
  token: AccessToken,
): SpotifyApi => {
  return SpotifyApi.withAccessToken(clientId, token);
};
