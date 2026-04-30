import React, { useEffect, useRef } from "react";
import { useScript } from "../../hooks/useScript";

type TwitchPlayerEventName = "online" | "offline";

interface TwitchPlayerInstance {
  addEventListener(eventName: TwitchPlayerEventName, handler: () => void): void;
  setVolume(volume: number): void;
  destroy(): void;
}

interface TwitchPlayerConstructor {
  new (
    elementId: string,
    options: {
      width: string | number;
      height: string | number;
      channel: string;
      parent: string[];
      autoplay?: boolean;
    },
  ): TwitchPlayerInstance;
  ONLINE: TwitchPlayerEventName;
  OFFLINE: TwitchPlayerEventName;
}

interface TwitchWindow extends Window {
  Twitch?: {
    Player: TwitchPlayerConstructor;
  };
}

export const HomePage: React.FC = () => {
  // This app is specific to the streamer August
  const channel = "august";

  const playerRef = useRef<TwitchPlayerInstance | null>(null);
  const [isLive, setIsLive] = React.useState<boolean | null>(null);

  // useScript must be called at top-level in component
  const scriptStatus = useScript("https://player.twitch.tv/js/embed/v1.js");

  // Initialize player when script is ready
  useEffect(() => {
    if (scriptStatus !== "ready") return;

    const twitchWindow = window as TwitchWindow;

    const options: {
      width: string | number;
      height: string | number;
      channel: string;
      parent: string[];
      autoplay?: boolean;
    } = {
      width: "100%",
      height: "100%",
      channel: channel,
      parent: [window.location.hostname],
      autoplay: false,
    };

    try {
      if (!twitchWindow.Twitch || !twitchWindow.Twitch.Player) {
        console.error("Twitch Player is not available after script load");
      } else {
        playerRef.current = new twitchWindow.Twitch.Player(
          "twitch-player",
          options,
        );
        playerRef.current.addEventListener(
          twitchWindow.Twitch.Player.ONLINE,
          () => {
            setIsLive(true);
          },
        );
        playerRef.current.addEventListener(
          twitchWindow.Twitch.Player.OFFLINE,
          () => {
            setIsLive(false);
          },
        );
        if (
          playerRef.current &&
          typeof playerRef.current.setVolume === "function"
        ) {
          playerRef.current.setVolume(0.5);
        }
      }
    } catch (err) {
      console.error("Error creating Twitch player:", err);
    }

    return () => {
      if (
        playerRef.current &&
        typeof playerRef.current.destroy === "function"
      ) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error(err);
        }
        playerRef.current = null;
      }
    };
  }, [scriptStatus, channel]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
      <main className="w-full max-w-5xl flex flex-col items-center gap-2 justify-center">
        <h1 className="text-4xl text-center flex items-center gap-3">
          <span>August</span>

          {isLive !== null ? (
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isLive
                  ? "bg-emerald-800/30 text-emerald-200"
                  : "bg-slate-700/40 text-slate-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive ? "bg-emerald-400" : "bg-slate-400"
                }`}
                aria-hidden
              />
              <span className="uppercase tracking-wide">
                {isLive ? "live" : "offline"}
              </span>
            </span>
          ) : null}
        </h1>

        <div className="w-full max-w-240 aspect-video">
          <div
            id="twitch-player"
            className="w-full h-full border rounded-md overflow-hidden"
          />
        </div>
      </main>
    </div>
  );
};
