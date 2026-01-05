import React from "react";

export const HomePage: React.FC = () => {
  const originName = window.location.origin;
  const redirectURL = `${originName}/twitch-callback`;
  const twitchClientID = "ykfl1k53cdzikvv1uwrasqyv0d10jk";
  const twitchAuthURL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${twitchClientID}&redirect_uri=${redirectURL}`;

  const sessionId = localStorage.getItem("august-session-id");

  return (
    <div className="flex items-center justify-center h-full flex-col gap-4 px-4">
      <nav className="w-full max-w-3xl flex justify-between items-center py-4">
        <div className="flex gap-4">
          <a href="/" className="text-lg font-medium">
            Home
          </a>
          <a href="/apology" className="text-lg font-medium">
            Apology
          </a>
        </div>
        <div>
          {!sessionId ? (
            <a
              href="/login"
              className="bg-[#8956FB] text-white px-3 py-1 rounded-md hover:bg-[#6f40d8] transition"
            >
              Log in
            </a>
          ) : null}
        </div>
      </nav>

      <h1 className="text-4xl">August</h1>

      <div className="w-full max-w-3xl h-[480px] border rounded-md overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://player.twitch.tv/?channel=august&parent=${window.location.hostname}`}
          allowFullScreen
          height="378"
          width="620"
        ></iframe>
      </div>

      <button
        onClick={() => window.open(twitchAuthURL, "_blank")}
        className="bg-[#8956FB] text-white px-4 py-2 rounded-md hover:bg-[#6f40d8] transition cursor-pointer"
      >
        Log in with Twitch
      </button>
    </div>
  );
};
