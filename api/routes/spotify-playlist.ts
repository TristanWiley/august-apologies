import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../utils";

// Simple in-process cache. For Cloudflare workers this is per instance and short-lived,
// but sufficient to avoid rapid repeated calls.
type SimpleTrack = {
  id: string;
  name: string;
  artists: string;
  duration_ms: number;
  external_url?: string | null;
  album?: string | null;
};

let cachedPlaylist: {
  id?: string;
  name?: string;
  description?: string;
  images?: Array<{ url?: string }>;
  tracks?: SimpleTrack[];
} | null = null;
let cachedAt = 0;
const CACHE_TTL = 60; // seconds

// Cache Spotify app token
let spotifyToken: string | null = null;
let spotifyTokenExpiresAt = 0;

const PLAYLIST_ID = "5ydVffCAhJeKwVdnQWIm5E";

type TokenResponse = { access_token?: string; expires_in?: number };

type SpotifyTrackItem = {
  track?: {
    uri?: string;
    name?: string;
    artists?: { name?: string }[];
    duration_ms?: number;
    external_urls?: { spotify?: string };
    album?: { name?: string };
  };
};

type SpotifyPlaylistResponse = {
  id?: string;
  name?: string;
  description?: string;
  images?: Array<{ url?: string }>;
  tracks?: { items?: SpotifyTrackItem[] };
};

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

type EnvWithSpotify = Env & {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
};

export const spotifyPlaylistRoute = async (
  _request: IRequest,
  env: EnvWithSpotify
) => {
  try {
    const now = Date.now() / 1000;

    // Serve from cache if fresh
    if (cachedPlaylist && now - cachedAt < CACHE_TTL) {
      return generateJSONResponse({ ...cachedPlaylist, cached: true }, 200);
    }

    // Ensure we have a valid app token
    if (!spotifyToken || now >= spotifyTokenExpiresAt) {
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: env.SPOTIFY_CLIENT_ID,
          client_secret: env.SPOTIFY_CLIENT_SECRET,
        }),
      });

      if (!tokenRes.ok) {
        console.error("spotify token failure", await tokenRes.text());
        return generateJSONResponse(
          { message: "Failed to get Spotify token" },
          500
        );
      }

      const tokenJSON = (await tokenRes.json()) as TokenResponse;
      spotifyToken = tokenJSON.access_token ?? null;
      spotifyTokenExpiresAt = now + (tokenJSON.expires_in ?? 3600) - 30; // 30s buffer
    }

    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}?fields=id,name,description,images,tracks.items(track(name,uri,artists(name),duration_ms,external_urls,album(name),started_at))`,
      {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    );

    if (!res.ok) {
      console.error("spotify playlist fetch failed", await res.text());
      return generateJSONResponse(
        { message: "Failed to fetch playlist from Spotify" },
        500
      );
    }

    const json = (await res.json()) as SpotifyPlaylistResponse;

    // Simplify tracks
    const tracks = (json.tracks?.items || []).map(
      (it: SpotifyTrackItem, idx: number) => ({
        id: it.track?.uri ?? `${json.id}:${idx}`,
        name: it.track?.name ?? "",
        artists: (it.track?.artists ?? []).map((a) => a.name ?? "").join(", "),
        duration_ms: it.track?.duration_ms ?? 0,
        external_url: it.track?.external_urls?.spotify ?? null,
        album: it.track?.album?.name ?? null,
      })
    );

    cachedPlaylist = {
      id: json.id,
      name: json.name,
      description: decodeHtmlEntities(json.description),
      images: json.images ?? [],
      tracks,
    };

    cachedAt = now;

    return generateJSONResponse({ ...cachedPlaylist, cached: false }, 200);
  } catch (err) {
    console.error("spotifyPlaylistRoute error:", err);
    return generateJSONResponse({ message: "Internal server error" }, 500);
  }
};
