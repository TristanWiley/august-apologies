import { AutoRouter, cors } from "itty-router";
import { loginRoute } from "./routes/login";
import { submitApologyRoute } from "./routes/submit-apology";
import { getApologyRoute } from "./routes/get-apology";
import { listApologiesRoute } from "./routes/list-apologies";
import { twitchStatusRoute } from "./routes/twitch-status";
import { spotifyPlaylistRoute } from "./routes/spotify-playlist";

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

router.post("/apologies", submitApologyRoute);
router.get("/apologies", listApologiesRoute);
router.get("/apologies/:id", getApologyRoute);

export default { ...router };
