import { AutoRouter, cors } from "itty-router";
import { loginRoute } from "./routes/login";
import { submitApologyRoute } from "./routes/apology";

const { preflight, corsify } = cors();

const router = AutoRouter({
  base: "/api",
  before: [preflight],
  finally: [corsify],
});

router.get("/session", () => {
  return new Response("TODO: Return session");
});

router.post("/login", loginRoute);

router.post("/apologies", submitApologyRoute);

export default { ...router };
