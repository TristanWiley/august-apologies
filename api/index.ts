import { AutoRouter, cors } from "itty-router";
import { loginRoute } from "./routes/login";
import { submitApologyRoute } from "./routes/submit-apology";
import { getApologyRoute } from "./routes/get-apology";
import { listApologiesRoute } from "./routes/list-apologies";
import { twitchStatusRoute } from "./routes/twitch-status";
import { spotifyPlaylistRoute } from "./routes/spotify-playlist";
import { getAccountSessionRoute } from "./routes/get-account-session";
import { spotifyAddTrackRoute } from "./routes/spotify-add-track";
import { spotifyRemoveTrackRoute } from "./routes/spotify-remove-track";

const { preflight, corsify } = cors();

const router = AutoRouter({
  base: "/api",
  before: [preflight],
  finally: [corsify],
});

router.get("/session", () => {
  return new Response("TODO: Return session");
});

router.get("/twitch/live", twitchStatusRoute);
router.get("/spotify/playlist", spotifyPlaylistRoute);

router.post("/login", loginRoute);

router.get("/accounts/session", getAccountSessionRoute);

router.post("/apologies", submitApologyRoute);
router.get("/apologies", listApologiesRoute);
router.get("/apologies/:id", getApologyRoute);

router.post("/spotify/playlist/add", spotifyAddTrackRoute);
router.post("/spotify/playlist/remove", spotifyRemoveTrackRoute);

export default { ...router };
