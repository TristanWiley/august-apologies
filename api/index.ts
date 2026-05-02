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
import { fromIttyRouter } from "chanfana";
import { SpotifyPlaylistEndpoint } from "./routes/spotify-playlist";
import { GetAccountSessionEndpoint } from "./routes/get-account-session";

const { preflight, corsify } = cors();

const router = AutoRouter({
  base: "/api",
  before: [preflight],
  finally: [corsify],
});

const openapi = fromIttyRouter(router);

openapi.get("/spotify/playlist", SpotifyPlaylistEndpoint);
openapi.get("/spotify/ownership", SpotifyOwnershipEndpoint);

openapi.post("/login", LoginEndpoint);

openapi.post("/admin/twitch/callback", AdminTwitchCallbackEndpoint);
openapi.get("/admin/twitch/info", AdminTwitchInfoEndpoint);
openapi.post("/admin/spotify/callback", AdminSpotifyCallbackEndpoint);
openapi.get("/admin/spotify/info", AdminSpotifyInfoEndpoint);
openapi.post("/admin/ban-user", BanUserEndpoint);
openapi.post("/admin/clear-cache", ClearCacheEndpoint);
openapi.post("/admin/set-trusted-user", SetTrustedUserEndpoint);
openapi.get("/admin/is-admin", IsAdminEndpoint);

// EventSub callback endpoint
openapi.post("/api/eventsub/callback", EventSubCallbackEndpoint);

openapi.get("/accounts/session", GetAccountSessionEndpoint);

openapi.post("/apologies", SubmitApologyEndpoint);
openapi.get("/apologies", ListApologiesEndpoint);
openapi.get("/apologies/:id", GetApologyEndpoint);

openapi.post("/spotify/playlist/add", SpotifyAddTrackEndpoint);
openapi.post("/spotify/playlist/remove", SpotifyRemoveTrackEndpoint);
openapi.get("/spotify/playlist/pending", SpotifyPendingSongsEndpoint);
openapi.post("/spotify/playlist/approve", SpotifyApproveSongEndpoint);
openapi.post("/spotify/playlist/disapprove", SpotifyDisapproveSongEndpoint);

// Command routes
openapi.get("/command/now-playing", CommandSpotifyNowPlayingEndpoint);

// Extension routes
openapi.get(
  "/extension/spotify/now-playing",
  ExtensionSpotifyNowPlayingEndpoint,
);

export default { ...router };
