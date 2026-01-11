import type { IRequest } from "itty-router";
import {
  generateJSONResponse,
  getPlaylistWithAllTracks,
  getSpotifyCredentials,
} from "../utils/utils";
import {
  SpotifyApi,
  type PlaylistedTrack,
  type Track,
  type AccessToken,
} from "@spotify/web-api-ts-sdk";
import { getStoredSpotifyPlaylist, storeSpotifyPlaylist } from "../utils/cache";

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
    // Get credentials from KV
    const credentials = await getSpotifyCredentials(env);
    if (!credentials || !credentials.access_token) {
      console.error("Failed to get Spotify credentials from KV");
      return null;
    }

    const spotifyClient = SpotifyApi.withAccessToken(credentials.client_id, {
      access_token: credentials.access_token,
      token_type: "Bearer",
      expires_in: credentials.access_token_expires_in || 3600,
    } as AccessToken);

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
