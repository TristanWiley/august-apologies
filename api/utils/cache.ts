import type { AccessToken } from "@spotify/web-api-ts-sdk";
import type { SimplifiedPlaylistToReturn } from "../routes/spotify-playlist";
import type { SpotifyOwnership } from "../types/db";

const PLAYLIST_TTL_SECONDS = 60; // 1 minute

export const storeSpotifyAccessToken = async (
  token: AccessToken
): Promise<void> => {
  const cacheKey = "https://kiriko.tv/api/spotify-access-token";
  const cache = caches.default;

  const response = new Response(JSON.stringify(token), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${token.expires_in - 120}`, // Subtract 120 seconds to be safe
    },
  });

  // Store the token in the cache
  await cache.put(cacheKey, response.clone());
};

export const getStoredSpotifyAccessToken =
  async (): Promise<AccessToken | null> => {
    const cacheKey = "https://kiriko.tv/api/spotify-access-token";
    const cache = caches.default;

    // Try to retrieve the token from the cache
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const tokenJSON = await cachedResponse.json();
      return tokenJSON as AccessToken;
    }

    return null;
  };

export const storeSpotifyPlaylist = async (
  playlist: SimplifiedPlaylistToReturn
): Promise<void> => {
  const cacheKey = `https://kiriko.tv/api/spotify-playlist/${playlist.id}`;
  const cache = caches.default;

  const response = new Response(JSON.stringify(playlist), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${PLAYLIST_TTL_SECONDS}`,
    },
  });

  // Store the playlist in the cache
  await cache.put(cacheKey, response.clone());
};

export const getStoredSpotifyPlaylist = async (
  playlistId: string
): Promise<SimplifiedPlaylistToReturn | null> => {
  const cacheKey = `https://kiriko.tv/api/spotify-playlist/${playlistId}`;
  const cache = caches.default;

  // Try to retrieve the playlist from the cache
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    const playlistJSON = await cachedResponse.json();
    return playlistJSON as SimplifiedPlaylistToReturn;
  }

  return null;
};

export const storeSpotifyOwnership = async (
  ownershipData: SpotifyOwnership
): Promise<void> => {
  const cacheKey = `https://kiriko.tv/api/spotify-ownership`;
  const cache = caches.default;

  const response = new Response(JSON.stringify(ownershipData), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${PLAYLIST_TTL_SECONDS}`,
    },
  });

  // Store the ownership data in the cache
  await cache.put(cacheKey, response.clone());
};

export const getStoredSpotifyOwnership =
  async (): Promise<SpotifyOwnership | null> => {
    const cacheKey = `https://kiriko.tv/api/spotify-ownership`;
    const cache = caches.default;

    // Try to retrieve the ownership data from the cache
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      const ownershipJSON = await cachedResponse.json();
      return ownershipJSON as SpotifyOwnership[];
    }

    return null;
  };
