import { AutoRouter, cors } from "itty-router";
import { LoginEndpoint } from "./routes/login";
import { SubmitApologyEndpoint } from "./routes/submit-apology";
import { GetApologyEndpoint } from "./routes/get-apology";
import { ListApologiesEndpoint } from "./routes/list-apologies";
import { SpotifyAddTrackEndpoint } from "./routes/spotify-add-track";
import { SpotifyRemoveTrackEndpoint } from "./routes/spotify-remove-track";
import { SpotifyApproveSongEndpoint } from "./routes/spotify-approve-song";
import { SpotifyDisapproveSongEndpoint } from "./routes/spotify-disapprove-song";
import { SpotifyPendingSongsEndpoint } from "./routes/spotify-pending-songs";
import { AdminTwitchCallbackEndpoint } from "./routes/admin/twitch-callback";
import { AdminTwitchInfoEndpoint } from "./routes/admin/twitch-info";
import { BanUserEndpoint } from "./routes/admin/ban-user";
import { ClearCacheEndpoint } from "./routes/admin/clear-cache";
import { SetTrustedUserEndpoint } from "./routes/admin/set-trusted-user";
import { EventSubCallbackEndpoint } from "./routes/eventsub-callback";
import { SpotifyOwnershipEndpoint } from "./routes/spotify-ownership";
import { IsAdminEndpoint } from "./routes/admin/is-admin";
import { AdminSpotifyCallbackEndpoint } from "./routes/admin/spotify-callback";
import { AdminSpotifyInfoEndpoint } from "./routes/admin/spotify-info";
import { CommandSpotifyNowPlayingEndpoint } from "./routes/command/spotify-now-playing";
import { ExtensionSpotifyNowPlayingEndpoint } from "./routes/extension/spotify-now-playing";
import { OverlaySpotifyNowPlayingEndpoint } from "./routes/overlay/spotify-now-playing";
import { fromIttyRouter } from "chanfana";
import { SpotifyPlaylistEndpoint } from "./routes/spotify-playlist";
import { GetAccountSessionEndpoint } from "./routes/get-account-session";

const { preflight, corsify } = cors();
const apiBase = "/api";

const router = AutoRouter({
  before: [preflight],
  finally: [corsify],
});

const openapi = fromIttyRouter(router, {
  schema: {
    info: {
      title: "August API",
      version: "1.0.0",
    },
  },
  openapiVersion: "3.1",
  docs_url: `${apiBase}/docs`,
  openapi_url: `${apiBase}/openapi.json`,
});

openapi.get(`${apiBase}/spotify/playlist`, SpotifyPlaylistEndpoint);
openapi.get(`${apiBase}/spotify/ownership`, SpotifyOwnershipEndpoint);

openapi.post(`${apiBase}/login`, LoginEndpoint);

openapi.post(`${apiBase}/admin/twitch/callback`, AdminTwitchCallbackEndpoint);
openapi.get(`${apiBase}/admin/twitch/info`, AdminTwitchInfoEndpoint);
openapi.post(`${apiBase}/admin/spotify/callback`, AdminSpotifyCallbackEndpoint);
openapi.get(`${apiBase}/admin/spotify/info`, AdminSpotifyInfoEndpoint);
openapi.post(`${apiBase}/admin/ban-user`, BanUserEndpoint);
openapi.post(`${apiBase}/admin/clear-cache`, ClearCacheEndpoint);
openapi.post(`${apiBase}/admin/set-trusted-user`, SetTrustedUserEndpoint);
openapi.get(`${apiBase}/admin/is-admin`, IsAdminEndpoint);

// EventSub callback endpoint
openapi.post(`${apiBase}/eventsub/callback`, EventSubCallbackEndpoint);

openapi.get(`${apiBase}/accounts/session`, GetAccountSessionEndpoint);

openapi.post(`${apiBase}/apologies`, SubmitApologyEndpoint);
openapi.get(`${apiBase}/apologies`, ListApologiesEndpoint);
openapi.get(`${apiBase}/apologies/:id`, GetApologyEndpoint);

openapi.post(`${apiBase}/spotify/playlist/add`, SpotifyAddTrackEndpoint);
openapi.post(`${apiBase}/spotify/playlist/remove`, SpotifyRemoveTrackEndpoint);
openapi.get(`${apiBase}/spotify/playlist/pending`, SpotifyPendingSongsEndpoint);
openapi.post(`${apiBase}/spotify/playlist/approve`, SpotifyApproveSongEndpoint);
openapi.post(
  `${apiBase}/spotify/playlist/disapprove`,
  SpotifyDisapproveSongEndpoint,
);

// Command routes
openapi.get(`${apiBase}/command/now-playing`, CommandSpotifyNowPlayingEndpoint);

// Extension routes
openapi.get(
  `${apiBase}/extension/spotify/now-playing`,
  ExtensionSpotifyNowPlayingEndpoint,
);

// Overlay routes
openapi.get(
  `${apiBase}/overlay/spotify/now-playing`,
  OverlaySpotifyNowPlayingEndpoint,
);

const fetch = router.fetch;

export { fetch };

export default { fetch };
