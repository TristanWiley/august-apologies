import { AutoRouter, cors } from "itty-router";
import { loginRoute } from "./routes/login";
import { submitApologyRoute } from "./routes/submit-apology";
import { getApologyRoute } from "./routes/get-apology";
import { listApologiesRoute } from "./routes/list-apologies";
import { spotifyPlaylistRoute } from "./routes/spotify-playlist";
import { getAccountSessionRoute } from "./routes/get-account-session";
import { spotifyAddTrackRoute } from "./routes/spotify-add-track";
import { spotifyRemoveTrackRoute } from "./routes/spotify-remove-track";
import { spotifyApproveSongRoute } from "./routes/spotify-approve-song";
import { spotifyDisapproveSongRoute } from "./routes/spotify-disapprove-song";
import { spotifyPendingSongsRoute } from "./routes/spotify-pending-songs";
import { adminTwitchCallbackRoute } from "./routes/admin/twitch-callback";
import { adminTwitchInfoRoute } from "./routes/admin/twitch-info";
import { banUserRoute } from "./routes/admin/ban-user";
import { clearCacheRoute } from "./routes/admin/clear-cache";
import { setTrustedUserRoute } from "./routes/admin/set-trusted-user";
import { eventsubCallbackRoute } from "./routes/eventsub-callback";
import { spotifyOwnershipRoute } from "./routes/spotify-ownership";

const { preflight, corsify } = cors();

const router = AutoRouter({
  base: "/api",
  before: [preflight],
  finally: [corsify],
});

router.get("/session", () => {
  return new Response("TODO: Return session");
});

router.get("/spotify/playlist", spotifyPlaylistRoute);
router.get("/spotify/ownership", spotifyOwnershipRoute);

router.post("/login", loginRoute);

router.post("/admin/twitch/callback", adminTwitchCallbackRoute);
router.get("/admin/twitch/info", adminTwitchInfoRoute);
router.post("/admin/ban-user", banUserRoute);
router.post("/admin/clear-cache", clearCacheRoute);
router.post("/admin/set-trusted-user", setTrustedUserRoute);

// EventSub callback endpoint
router.post("/api/eventsub/callback", eventsubCallbackRoute);

router.get("/accounts/session", getAccountSessionRoute);

router.post("/apologies", submitApologyRoute);
router.get("/apologies", listApologiesRoute);
router.get("/apologies/:id", getApologyRoute);

router.post("/spotify/playlist/add", spotifyAddTrackRoute);
router.post("/spotify/playlist/remove", spotifyRemoveTrackRoute);
router.get("/spotify/playlist/pending", spotifyPendingSongsRoute);
router.post("/spotify/playlist/approve", spotifyApproveSongRoute);
router.post("/spotify/playlist/disapprove", spotifyDisapproveSongRoute);

export default { ...router };
