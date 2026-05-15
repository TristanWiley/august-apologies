import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { getOverlaySpotifyCredentials } from "../../utils/overlay";
import { SpotifyApi } from "@tristanwiley/spotify-web-api-ts-sdk";
import type {
  SimplifiedArtist,
  Track,
} from "@tristanwiley/spotify-web-api-ts-sdk";
import { DB } from "../../db";
import {
  getStoredSpotifySongAdder,
  storeSpotifySongAdder,
} from "../../utils/cache";
import { contentJson, OpenAPIRoute } from "chanfana";
import z from "zod";

const OverlaySpotifyNowPlayingArtistSchema = z.object({
  external_urls: z.object({
    spotify: z.string(),
  }),
  href: z.string(),
  id: z.string(),
  name: z.string(),
  type: z.string(),
  uri: z.string(),
});

const OverlaySpotifyNowPlayingTrackSchema = z.object({
  artists: z.array(OverlaySpotifyNowPlayingArtistSchema),
  title: z.string(),
  addedBy: z.string().optional(),
  image: z
    .object({
      url: z.string(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    })
    .nullable(),
  remainingDurationMs: z.number().optional(), // Optional field for remaining duration in milliseconds
});

const OverlaySpotifyNowPlayingEndpointResponseSchema = z.object({
  track: OverlaySpotifyNowPlayingTrackSchema.nullable(),
});

export class OverlaySpotifyNowPlayingEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get the currently playing Spotify track for the overlay",
    description:
      "Retrieve the currently playing Spotify track, including who added it if available.",
    tags: ["Overlay"],
    request: {
      query: z.object({
        secretAugustKey: z.string(),
      }),
    },
    responses: {
      200: {
        description: "The currently playing Spotify track",
        ...contentJson(OverlaySpotifyNowPlayingEndpointResponseSchema),
      },
    },
  };

  async handle(request: IRequest, env: Env): Promise<Response> {
    console.log(request.query);
    if (
      request.query.secretAugustKey !==
      "SECRET_KEY_e84645fd-2c71-450a-89e8-46cb72615f6a"
    ) {
      return generateJSONResponse({ message: "Unauthorized" }, 401);
    }

    const credentials = await getOverlaySpotifyCredentials(env);

    if (!credentials) {
      return generateJSONResponse(
        { message: "Spotify credentials not configured" },
        500,
      );
    }

    const spotifyClient = SpotifyApi.withAccessToken(
      env.SPOTIFY_CLIENT_ID,
      credentials,
    );

    const response = await spotifyClient.player.getCurrentlyPlayingTrack();

    if (
      !response ||
      !response.item ||
      !response.is_playing ||
      response.currently_playing_type !== "track"
    ) {
      return generateJSONResponse({ track: null }, 200);
    }

    const progressMS = response.progress_ms ?? 0;
    const durationMS = response.item.duration_ms;
    const remainingDurationMs = durationMS - progressMS;

    const track = response.item as Track;

    const artists: SimplifiedArtist[] = track.artists;
    const title = track.name;
    // get square image
    const bestImage =
      track.album?.images?.find((image) => image.width === image.height) ||
      track.album?.images?.[0] ||
      null;

    // Find who added the song if we can
    const cachedSongAdder = await getStoredSpotifySongAdder(track.uri);
    let addedBy: { displayName: string } | null = null;

    if (cachedSongAdder) {
      if (cachedSongAdder.displayName) {
        addedBy = { displayName: cachedSongAdder.displayName };
      }
    } else {
      const db = new DB(env);
      const songAdder = await db.getSongAdder(track.uri);

      addedBy = songAdder ? { displayName: songAdder.displayName } : null;

      await storeSpotifySongAdder(track.uri, addedBy?.displayName ?? null);
    }

    return generateJSONResponse(
      {
        track: {
          artists,
          title,
          addedBy: addedBy?.displayName || null,
          image: bestImage,
          remainingDurationMs: remainingDurationMs,
        },
        shouldReload: false,
      },
      200,
    );
  }
}
