import type { IRequest } from "itty-router";
import {
  generateJSONResponse,
  getPlaylistWithAllTracks,
  getSpotifyCredentials,
} from "../utils/utils";
import {
  type PlaylistedTrack,
  type Track,
  type AccessToken,
} from "@spotify/web-api-ts-sdk";
import { getStoredSpotifyPlaylist, storeSpotifyPlaylist } from "../utils/cache";
import { createSpotifyApiClient } from "../utils/spotify-client";
import { contentJson, OpenAPIRoute } from "chanfana";
import z from "zod";
import { ErrorResponseSchema } from "../types/endpoints";

const SpotifyPlaylistEndpointResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(
    z.object({
      url: z.string(),
      height: z.number().nullable(),
      width: z.number().nullable(),
    }),
  ),
  tracks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      artists: z.string(),
      duration_ms: z.number(),
      external_url: z.string().url().nullable(),
      album: z.string().nullable(),
    }),
  ),
});

type SpotifyPlaylistEndpointResponse = z.infer<
  typeof SpotifyPlaylistEndpointResponseSchema
>;

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";
const CACHE_REFRESH_THRESHOLD = 60;

// Decode common HTML entities and numeric entities so descriptions like
// "Half these songs aren&#x27;t..." render correctly as plain text.
function decodeHtmlEntities(input?: string): string | undefined {
  if (!input) return input;
  // Numeric entities (decimal)
  let out = input.replace(/&#(\d+);/g, (_m, dec) =>
    String.fromCharCode(Number(dec)),
  );
  // Numeric entities (hex)
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
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
  env: Env,
): Promise<SpotifyPlaylistEndpointResponse | null> {
  try {
    // Get credentials from KV
    const credentials = await getSpotifyCredentials(env);
    if (!credentials || !credentials.access_token) {
      console.error("Failed to get Spotify credentials from KV");
      return null;
    }

    const spotifyClient = createSpotifyApiClient(credentials.client_id, {
      access_token: credentials.access_token,
      token_type: "Bearer",
      expires_in: credentials.access_token_expires_in || 3600,
    } as AccessToken);

    const playlist = await getPlaylistWithAllTracks(spotifyClient, PLAYLIST_ID);

    // Simplify tracks
    const tracks = playlist.tracks.items.map(
      (it: PlaylistedTrack<Track>, idx: number) => {
        const playableItem = ((it as unknown as { item?: Track }).item ??
          it.track) as Track | undefined;

        return {
          id: playableItem?.uri ?? `${playlist.id}:${idx}`,
          name: playableItem?.name ?? "",
          artists: (playableItem?.artists ?? [])
            .map((a) => a.name ?? "")
            .join(", "),
          duration_ms: playableItem?.duration_ms ?? 0,
          external_url: playableItem?.external_urls?.spotify ?? null,
          album: playableItem?.album?.name ?? null,
        };
      },
    );

    const simplifiedPlaylist: SpotifyPlaylistEndpointResponse = {
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

export class SpotifyPlaylistEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get the Spotify playlist with all tracks",
    description:
      "Returns the Spotify playlist with all tracks. Uses caching to improve performance, with background refresh when cache is stale.",
    tags: ["Spotify"],
    responses: {
      200: {
        description: "Successful response with playlist data",
        ...contentJson(SpotifyPlaylistEndpointResponseSchema),
      },
      500: {
        description: "Internal server error",
        ...contentJson(ErrorResponseSchema),
      },
    },
  };

  async handle(_request: IRequest, env: Env, ctx: ExecutionContext) {
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
        return generateJSONResponse(
          { message: "Failed to fetch playlist" },
          500,
        );
      }

      return generateJSONResponse(freshPlaylist, 200);
    } catch (err) {
      console.error("spotifyPlaylistRoute error:", err);
      return generateJSONResponse({ message: "Internal server error" }, 500);
    }
  }
}
