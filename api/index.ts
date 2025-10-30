import { AutoRouter, cors } from "itty-router";
import { loginRoute } from "./routes/login";

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

router.post("/create-apology", () => {
  return new Response("TODO: Create apology");
});

router.post("/submit-apology", () => {
  return new Response("TODO: Submit apology");
});

export default { ...router };
