import { LoginButton } from "../login-button";
import { Nav } from "../nav";

export const LoginPage = () => {
  const redirectParam =
    new URLSearchParams(window.location.search).get("redirect") || "/";

  return (
    <div className="flex items-center justify-center h-full flex-col gap-4 px-4">
      <Nav />

      <div className="w-full max-w-3xl flex flex-col items-center gap-4">
        <h2 className="text-4xl">Please login to view this page!</h2>
        <p className="text-xl pb-4">
          Log in with Twitch to submit your apology.
        </p>

        <LoginButton onAuth={() => window.location.replace(redirectParam)} />
      </div>
    </div>
  );
};
