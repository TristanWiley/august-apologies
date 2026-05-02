import type { IRequest } from "itty-router";
import { generateJSONResponse, generateTextResponse } from "../../utils/utils";
import { getOverlaySpotifyCredentials } from "../../utils/overlay";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { Track } from "@spotify/web-api-ts-sdk";
import { DB } from "../../db";
import {
  getStoredSpotifySongAdder,
  storeSpotifySongAdder,
} from "../../utils/cache";
import { OpenAPIRoute } from "chanfana";
import z from "zod";

export class CommandSpotifyNowPlayingEndpoint extends OpenAPIRoute {
  schema = {
    summary: "Get the currently playing Spotify track",
    description:
      "Retrieve the currently playing Spotify track, including who added it if available.",
    tags: ["Commands"],
    responses: {
      200: {
        description: "The currently playing Spotify track",
        content: {
          "text/plain": {
            schema: z.string(),
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
      return generateTextResponse("No track currently playing", 200);
    }

    const track = response.item as Track;

    const artists = track.artists
      .slice(0, 2)
      .map((artist) => artist.name)
      .join(", ");
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
      return generateTextResponse(
        `${artists} - ${title} (added by ${addedBy.displayName})`,
        200,
      );
    }

    return generateTextResponse(`${artists} - ${title}`, 200);
  };
}
