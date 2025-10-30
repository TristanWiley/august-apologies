import { AutoRouter } from "itty-router";

const router = AutoRouter({
  base: "/api",
});

router.get("/session", () => {
  return new Response("TODO: Return session");
});

router.post("/login", () => {
  return new Response("TODO: Login with Twitch and create session");
});

router.post("/create-apology", () => {
  return new Response("TODO: Create apology");
});

router.post("/submit-apology", () => {
  return new Response("TODO: Submit apology");
});

export default { ...router };
