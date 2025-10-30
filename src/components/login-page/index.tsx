import { useCallback, useEffect, useState } from "react";

export const LoginPage: React.FC = () => {
  const originName = window.location.origin;
  const redirectURL = `${originName}/twitch-callback`;
  const twitchClientID = "ykfl1k53cdzikvv1uwrasqyv0d10jk";
  const twitchAuthURL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${twitchClientID}&redirect_uri=${redirectURL}`;

  const [loading, setLoading] = useState(false);

  const connectTwitch = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, redirectURL }),
        });

        if (!response.ok) {
          throw new Error("Failed to authenticate with Twitch");
        }

        const { data } = await response.json();
        const sessionId = data.sessionId;
        const subject = data.subject;
        const apology = data.apology;

        if (subject) {
          localStorage.setItem("august-temp-subject", subject);
        }

        if (apology) {
          localStorage.setItem("august-temp-apology", apology);
        }

        localStorage.setItem("august-session-id", sessionId);
        window.location.reload();
      } catch (error) {
        console.error("Error during Twitch authentication:", error);
      }
    },
    [redirectURL]
  );

  // Event listener to check for twitch auth code
  useEffect(() => {
    const handleTwitchConnect = (event: StorageEvent) => {
      if (event.key === "august-twitch-code" && event.newValue) {
        connectTwitch(event.newValue);
      }
    };

    window.addEventListener("storage", handleTwitchConnect);

    return () => {
      window.removeEventListener("storage", handleTwitchConnect);
    };
  }, [connectTwitch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl">Loading...</p>
        <img
          src="/augRiot.webp"
          alt="Loading"
          className="w-8 h-8 ml-4 animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full flex-col gap-2">
      <h2 className="text-4xl">
        So you said something stupid in Twitch chat...
      </h2>
      <p className="text-xl pb-4">Log in with Twitch to submit your apology.</p>
      <button
        onClick={() => {
          window.open(twitchAuthURL, "_blank");
        }}
        className="bg-[#8956FB] text-white px-4 py-2 rounded-md hover:bg-[#6f40d8] transition cursor-pointer"
      >
        Log in with Twitch
      </button>
    </div>
  );
};
