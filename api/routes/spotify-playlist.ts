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

export const spotifyPlaylistRoute = async (_request: IRequest, env: Env) => {
  try {
    const now = Date.now() / 1000;

    const cachedPlaylist = await getStoredSpotifyPlaylist(PLAYLIST_ID);
    if (cachedPlaylist) {
      console.log("Using cached Spotify playlist");
      return generateJSONResponse({ ...cachedPlaylist, cached: true }, 200);
    }

    let spotifyToken: string | null = null;
    let spotifyTokenExpiresAt = 0;
    let spotifyClient: SpotifyApi | null = null;
    let isUsingCachedToken = false;

    // Check if the access token is cached and valid
    const cachedTokenData = await getStoredSpotifyAccessToken();
    if (cachedTokenData) {
      console.log("Using cached Spotify access token");
      spotifyToken = cachedTokenData.access_token;
      spotifyTokenExpiresAt = cachedTokenData.expires || 0;
      spotifyClient = SpotifyApi.withAccessToken(
        env.SPOTIFY_CLIENT_ID,
        cachedTokenData
      );
      isUsingCachedToken = true;
    }

    // Ensure we have a valid app token
    if (!spotifyToken || now >= spotifyTokenExpiresAt) {
      spotifyClient = SpotifyApi.withClientCredentials(
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET
      );
    }

    if (!spotifyClient) {
      console.error("Failed to initialize Spotify client");
      return generateJSONResponse(
        { message: "Failed to initialize Spotify client" },
        500
      );
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

    return generateJSONResponse({ ...simplifiedPlaylist, cached: false }, 200);
  } catch (err) {
    console.error("spotifyPlaylistRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
