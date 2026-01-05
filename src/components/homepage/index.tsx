import { Nav } from "../nav";
import React, { useEffect, useRef } from "react";
import { useScript } from "../../hooks/useScript";

// Lightweight player typings to avoid `any`
type TwitchPlayer = {
  setVolume?: (n: number) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    Twitch?: {
      Player: new (
        id: string,
        options: {
          width: string | number;
          height: string | number;
          channel: string;
          parent: string[];
        }
      ) => TwitchPlayer;
    };
  }
}

export const HomePage: React.FC = () => {
  // This app is specific to the streamer August
  const channel = "august";

  const playerRef = useRef<TwitchPlayer | null>(null);
  const [isLive, setIsLive] = React.useState<boolean | null>(null);
  const [viewerCount, setViewerCount] = React.useState<number | null>(null);
  const [startedAt, setStartedAt] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<string | null>(null);

  function formatDuration(seconds: number) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${m}:${pad(s)}`;
  }
  // useScript must be called at top-level in component
  const scriptStatus = useScript("https://player.twitch.tv/js/embed/v1.js");

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/twitch/live`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setIsLive(Boolean(data.live));
        setViewerCount(data.viewer_count ?? null);
        setStartedAt(data.started_at ?? null);
      } catch (err) {
        console.error("Failed to fetch twitch status:", err);
      }
    };

    // initial status fetch
    fetchStatus();
    // poll every 60 seconds
    const realInterval = window.setInterval(fetchStatus, 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(realInterval);
    };
  }, [channel]);

  // Initialize player when script is ready
  useEffect(() => {
    if (scriptStatus !== "ready") return;

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
      if (!window.Twitch || !window.Twitch.Player) {
        console.error("Twitch Player is not available after script load");
      } else {
        playerRef.current = new window.Twitch.Player("twitch-player", options);
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

  // Update duration display while live
  useEffect(() => {
    if (!isLive || !startedAt) {
      setDuration(null);
      return;
    }

    const update = () => {
      const secs = Math.max(
        0,
        Math.floor((Date.now() - Date.parse(startedAt)) / 1000)
      );
      setDuration(formatDuration(secs));
    };

    update();
    const id = window.setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isLive, startedAt]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
      <Nav />

      <main className="w-full max-w-5xl mt-2 flex flex-col items-center gap-2 justify-center">
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

        <div className="w-[960px] h-[540px]">
          <div
            id="twitch-player"
            className="w-full h-full  border rounded-md overflow-hidden"
          />

          {isLive ? (
            <div className="w-full flex justify-end mt-2">
              <div className="flex flex-col items-end space-y-1">
                <div className="text-sm font-semibold text-red-400 bg-red-900/20 px-2 py-1 rounded">
                  {viewerCount !== null
                    ? `${viewerCount.toLocaleString()} viewers`
                    : "Live"}
                </div>
                {duration ? (
                  <div className="text-xs text-red-300 bg-red-900/10 px-2 py-0.5 rounded">
                    {duration}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};
