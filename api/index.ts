import { AutoRouter, cors } from "itty-router";
import { loginRoute } from "./routes/login";
import { submitApologyRoute } from "./routes/submit-apology";
import { getApologyRoute } from "./routes/get-apology";
import { twitchStatusRoute } from "./routes/twitch-status";

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

router.post("/login", loginRoute);

router.post("/apologies", submitApologyRoute);
router.get("/apologies/:id", getApologyRoute);

export default { ...router };
