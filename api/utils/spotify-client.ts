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

const shimmedSpotifyFetch: RequestImplementation = (input, oldInit) => {
  // If the request body has "tracks" instead of "items", rewrite it to "items" for Spotify API compatibility
  let init: RequestInit = { ...oldInit };
  if (init.body) {
    try {
      const body = JSON.parse(init.body.toString());
      if (body.tracks && !body.items) {
        body.items = body.tracks;
        delete body.tracks;
        init.body = JSON.stringify(body);
        console.log("Rewrote request body from 'tracks' to 'items'");
      }
    } catch (err) {
      console.warn("Failed to parse request body for rewriting:", err);
    }
  }

  console.log(
    "New fetch params:",
    typeof input === "string" ? input : input.url,
    init,
  );

  if (typeof input === "string") {
    console.log("Original URL:", input);
    const rewrittenUrl = rewritePlaylistTracksToItems(input);
    if (rewrittenUrl !== input) {
      console.log("Rewritten URL:", rewrittenUrl);
      return fetch(rewrittenUrl, init);
    }
  }

  if (input instanceof URL) {
    console.log("Original URL:", input.toString());
    const rewrittenUrl = rewritePlaylistTracksToItems(input.toString());
    if (rewrittenUrl !== input.toString()) {
      console.log("Rewritten URL:", rewrittenUrl);
      return fetch(new URL(rewrittenUrl), init);
    }
  }

  const rewrittenUrl = rewritePlaylistTracksToItems(input.url);
  if (rewrittenUrl !== input.url) {
    console.log("Rewritten URL:", rewrittenUrl);
    return fetch(new Request(rewrittenUrl, input), init);
  }

  console.log("Spotify fetch: No rewrite needed for URL:", input.url);

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
