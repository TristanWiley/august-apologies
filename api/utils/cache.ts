import type { AccessToken } from "@spotify/web-api-ts-sdk";
import type { SimplifiedPlaylistToReturn } from "../routes/spotify-playlist";
import type { SpotifyOwnership } from "../types/db";

const PLAYLIST_TTL_SECONDS = 86400; // 24 hours (we check staleness manually)

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

  // Store with timestamp for manual staleness checking
  const cachedData = {
    playlist,
    cachedAt: Date.now(),
  };

  const response = new Response(JSON.stringify(cachedData), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${PLAYLIST_TTL_SECONDS}`,
      "Cache-Tag": "spotify-playlist",
    },
  });

  // Store the playlist in the cache
  await cache.put(cacheKey, response.clone());
};

export const getStoredSpotifyPlaylist = async (
  playlistId: string
): Promise<{ playlist: SimplifiedPlaylistToReturn; age: number } | null> => {
  const cacheKey = `https://kiriko.tv/api/spotify-playlist/${playlistId}`;
  const cache = caches.default;

  // Try to retrieve the playlist from the cache
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    const cachedData = (await cachedResponse.json()) as {
      playlist: SimplifiedPlaylistToReturn;
      cachedAt: number;
    };

    // Calculate cache age from stored timestamp
    const age = Math.floor((Date.now() - cachedData.cachedAt) / 1000);

    return { playlist: cachedData.playlist, age };
  }

  return null;
};

export const storeSpotifyOwnership = async (
  ownershipData: SpotifyOwnership
): Promise<void> => {
  const cacheKey = `https://kiriko.tv/api/spotify-ownership`;
  const cache = caches.default;

  // Store with timestamp for manual staleness checking
  const cachedData = {
    ownership: ownershipData,
    cachedAt: Date.now(),
  };

  const response = new Response(JSON.stringify(cachedData), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${PLAYLIST_TTL_SECONDS}`,
      "Cache-Tag": "spotify-ownership",
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
      const cachedData = (await cachedResponse.json()) as {
        ownership: SpotifyOwnership;
        cachedAt: number;
      };

      return cachedData.ownership as SpotifyOwnership;
    }

    return null;
  };

export const clearSpotifyPlaylistCache = async (
  playlistId: string,
  env: Env
): Promise<void> => {
  const cacheKey = `https://kiriko.tv/api/spotify-playlist/${playlistId}`;
  const cache = caches.default;

  // Delete locally first
  await cache.delete(cacheKey);

  // Purge globally using Cache-Tag via Cloudflare API
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tags: ["spotify-playlist"],
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to purge playlist cache by tag:",
        await response.text()
      );
    } else {
      console.log(`Purged spotify-playlist cache globally via tag`);
    }
  } catch (err) {
    console.error("Error purging playlist cache by tag:", err);
  }
};

export const clearSpotifyOwnershipCache = async (env: Env): Promise<void> => {
  const cacheKey = `https://kiriko.tv/api/spotify-ownership`;
  const cache = caches.default;

  // Delete locally first
  await cache.delete(cacheKey);

  // Purge globally using Cache-Tag via Cloudflare API
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tags: ["spotify-ownership"],
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to purge cache by tag:", await response.text());
    } else {
      console.log("Purged spotify-ownership cache globally via tag");
    }
  } catch (err) {
    console.error("Error purging cache by tag:", err);
  }
};
