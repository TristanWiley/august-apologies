import type { IRequest } from "itty-router";
import { generateJSONResponse } from "../../utils/utils";
import { getOverlaySpotifyCredentials } from "../../utils/overlay";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { SimplifiedArtist, Track } from "@spotify/web-api-ts-sdk";
import { DB } from "../../db";
import {
  getStoredSpotifySongAdder,
  storeSpotifySongAdder,
} from "../../utils/cache";
import { OpenAPIRoute } from "chanfana";
import z from "zod";

const ExtensionSpotifyNowPlayingArtistSchema = z.object({
  external_urls: z.object({
    spotify: z.string(),
  }),
  href: z.string(),
  id: z.string(),
  name: z.string(),
  type: z.string(),
  uri: z.string(),
});

const ExtensionSpotifyNowPlayingTrackSchema = z.object({
  artists: z.array(ExtensionSpotifyNowPlayingArtistSchema),
  title: z.string(),
  addedBy: z.string().optional(),
});

const ExtensionSpotifyNowPlayingEndpointResponseSchema = z.object({
  track: ExtensionSpotifyNowPlayingTrackSchema.nullable(),
});

export class ExtensionSpotifyNowPlayingEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get the currently playing Spotify track for the extension",
    description:
      "Retrieve the currently playing Spotify track, including who added it if available.",
    tags: ["Extension"],
    responses: {
      200: {
        description: "The currently playing Spotify track",
        content: {
          "application/json": {
            schema: ExtensionSpotifyNowPlayingEndpointResponseSchema,
          },
        },
      },
    },
  };

  static handle = async (_request: IRequest, env: Env) => {
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

    const track = response.item as Track;

    const artists: SimplifiedArtist[] = track.artists;
    const title = track.name;

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

    if (addedBy) {
      return generateJSONResponse(
        { track: { artists, title, addedBy: addedBy.displayName } },
        200,
      );
    }

    return generateJSONResponse({ track: { artists, title } }, 200);
  };
}
