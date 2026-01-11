import type { IRequest } from "itty-router";
import { generateJSONResponse, getPlaylistWithAllTracks } from "../utils/utils";
import {
  SpotifyApi,
  type PlaylistedTrack,
  type Track,
} from "@spotify/web-api-ts-sdk";
import {
  getStoredSpotifyAccessToken,
  getStoredSpotifyPlaylist,
  storeSpotifyAccessToken,
  storeSpotifyPlaylist,
} from "../utils/cache";

export interface SimplifiedPlaylistToReturn {
  id: string;
  name: string;
  description: string | undefined;
  images: Array<{ url: string; height: number | null; width: number | null }>;
  tracks: Array<{
    id: string;
    name: string;
    artists: string;
    duration_ms: number;
    external_url: string | null;
    album: string | null;
  }>;
}

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";
const CACHE_REFRESH_THRESHOLD = 60;

// Decode common HTML entities and numeric entities so descriptions like
// "Half these songs aren&#x27;t..." render correctly as plain text.
function decodeHtmlEntities(input?: string): string | undefined {
  if (!input) return input;
  // Numeric entities (decimal)
  let out = input.replace(/&#(\d+);/g, (_m, dec) =>
    String.fromCharCode(Number(dec))
  );
  // Numeric entities (hex)
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16))
  );
  // Named entities
  const map: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  out = out.replace(/&([a-zA-Z]+);/g, (_m, name) => map[name] ?? `&${name};`);
  return out;
}

// Background function to fetch and cache playlist
async function fetchAndCachePlaylist(
  env: Env
): Promise<SimplifiedPlaylistToReturn | null> {
  try {
    const now = Date.now() / 1000;
    let spotifyClient: SpotifyApi | null = null;
    let isUsingCachedToken = false;

    // Check if the access token is cached and valid
    const cachedTokenData = await getStoredSpotifyAccessToken();
    if (cachedTokenData) {
      console.log("Using cached Spotify access token");
      const spotifyTokenExpiresAt = cachedTokenData.expires || 0;
      spotifyClient = SpotifyApi.withAccessToken(
        env.SPOTIFY_CLIENT_ID,
        cachedTokenData
      );
      isUsingCachedToken = true;

      // Ensure we have a valid app token
      if (now >= spotifyTokenExpiresAt) {
        spotifyClient = SpotifyApi.withClientCredentials(
          env.SPOTIFY_CLIENT_ID,
          env.SPOTIFY_CLIENT_SECRET
        );
      }
    } else {
      // Get new token
      spotifyClient = SpotifyApi.withClientCredentials(
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET
      );
    }

    if (!spotifyClient) {
      console.error("Failed to initialize Spotify client");
      return null;
    }

    const playlist = await getPlaylistWithAllTracks(spotifyClient, PLAYLIST_ID);

    // Simplify tracks
    const tracks = playlist.tracks.items.map(
      (it: PlaylistedTrack<Track>, idx: number) => ({
        id: it.track?.uri ?? `${playlist.id}:${idx}`,
        name: it.track?.name ?? "",
        artists: (it.track?.artists ?? []).map((a) => a.name ?? "").join(", "),
        duration_ms: it.track?.duration_ms ?? 0,
        external_url: it.track?.external_urls?.spotify ?? null,
        album: it.track?.album?.name ?? null,
      })
    );

    const simplifiedPlaylist: SimplifiedPlaylistToReturn = {
      id: playlist.id,
      name: playlist.name,
      description: decodeHtmlEntities(playlist.description),
      images: playlist.images ?? [],
      tracks,
    };

    // Cache the simplified playlist
    await storeSpotifyPlaylist(simplifiedPlaylist);

    // If we obtained a new access token, cache it
    const newAccessToken = await spotifyClient.getAccessToken();
    if (newAccessToken && !isUsingCachedToken) {
      await storeSpotifyAccessToken(newAccessToken);
    }

    return simplifiedPlaylist;
  } catch (err) {
    console.error("fetchAndCachePlaylist error:", err);
    return null;
  }
}

export const spotifyPlaylistRoute = async (
  request: IRequest,
  env: Env,
  ctx: ExecutionContext
) => {
  try {
    const cachedData = await getStoredSpotifyPlaylist(PLAYLIST_ID);

    // If we have cached data, return it immediately
    if (cachedData) {
      console.log(`Using cached Spotify playlist (age: ${cachedData.age}s)`);

      // If cache is getting stale, trigger background refresh
      if (cachedData.age > CACHE_REFRESH_THRESHOLD) {
        console.log("Cache is stale, refreshing in background");
        ctx.waitUntil(fetchAndCachePlaylist(env));
      }

      return generateJSONResponse(cachedData.playlist, 200);
    }

    // No cache - fetch synchronously (first time only)
    console.log("No cache found, fetching from Spotify");
    const freshPlaylist = await fetchAndCachePlaylist(env);

    if (!freshPlaylist) {
      return generateJSONResponse({ message: "Failed to fetch playlist" }, 500);
    }

    return generateJSONResponse(freshPlaylist, 200);
  } catch (err) {
    console.error("spotifyPlaylistRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
