import type { Playlist, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import type { KVTwitchAuthPermissions } from "../types/kv";
import type { TwitchOAuthTokenResponse } from "../types/twitch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateJSONResponse = (json: any, status: number): Response => {
  // If the status is an error, log the error
  if (status >= 400) {
    console.error(json);
  }

  return new Response(JSON.stringify(json), {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
    status,
  });
};

export const getValidBroadcasterAccessToken = async (env: Env) => {
  try {
    const kv = env.PERMISSIONS_KV;

    const raw = await kv.get("twitch:admin:auth");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as KVTwitchAuthPermissions;
    const { access_token, expires_in, obtained_at, refresh_token } = parsed;

    let accessTokenToReturn: string | null = null;

    // Check if the token is expired
    const now = Date.now();
    if (now >= obtained_at + expires_in * 1000) {
      console.warn("Twitch broadcaster token is expired, refreshing...");

      // Token is expired, refresh it
      const tokenResponse = await fetch(
        `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&refresh_token=${refresh_token}`,
        {
          method: "POST",
        }
      );

      if (!tokenResponse.ok) {
        console.error(
          "Failed to refresh Twitch broadcaster token",
          await tokenResponse.text()
        );
        return null;
      }

      const tokenJson =
        (await tokenResponse.json()) as TwitchOAuthTokenResponse;
      const {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: newExpiresIn,
        scope,
        token_type,
      } = tokenJson;

      // Store the new token in KV
      const newStored: KVTwitchAuthPermissions = {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: newExpiresIn,
        token_type: token_type,
        scope,
        obtained_at: Date.now(),
      };

      await kv.put("twitch:admin:auth", JSON.stringify(newStored));
      accessTokenToReturn = newAccessToken;
    } else {
      // Token is still valid
      accessTokenToReturn = access_token;
    }

    return accessTokenToReturn;
  } catch (err) {
    console.error("Error getting valid broadcaster access token", err);
    return null;
  }
};

export const getPlaylistWithAllTracks = async (
  spotifyClient: SpotifyApi,
  playlistId: string
): Promise<Playlist<Track>> => {
  const playlist = await spotifyClient.playlists.getPlaylist(playlistId);

  const trackItems = [...playlist.tracks.items];
  let fetchedAllTracks = !playlist.tracks.next;
  let offset = playlist.tracks.limit;
  const limit = 50;

  while (!fetchedAllTracks) {
    const playlistTracksRes = await spotifyClient.playlists.getPlaylistItems(
      playlistId,
      undefined,
      undefined,
      limit,
      offset
    );
    trackItems.push(...playlistTracksRes.items);
    offset = offset + limit;
    fetchedAllTracks = !playlistTracksRes.next;
  }

  playlist.tracks.items = trackItems;

  return playlist;
};
