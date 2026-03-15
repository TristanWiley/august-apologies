import {
  SpotifyApi,
  type AccessToken,
  type RequestImplementation,
} from "@spotify/web-api-ts-sdk";

const spotifyPlaylistTracksPathRegex =
  /^(https:\/\/api\.spotify\.com\/v1\/playlists\/[^/]+)\/tracks(?=\/|\?|#|$)/;

const rewritePlaylistTracksToItems = (url: string): string => {
  return url.replace(spotifyPlaylistTracksPathRegex, "$1/items");
};

const shimmedSpotifyFetch: RequestImplementation = (input, init) => {
  if (typeof input === "string") {
    return fetch(rewritePlaylistTracksToItems(input), init);
  }

  if (input instanceof URL) {
    return fetch(new URL(rewritePlaylistTracksToItems(input.toString())), init);
  }

  const rewrittenUrl = rewritePlaylistTracksToItems(input.url);
  if (rewrittenUrl !== input.url) {
    return fetch(new Request(rewrittenUrl, input), init);
  }

  return fetch(input, init);
};

export const createSpotifyApiClient = (
  clientId: string,
  token: AccessToken,
): SpotifyApi => {
  return SpotifyApi.withAccessToken(clientId, token, {
    fetch: shimmedSpotifyFetch,
  });
};
