import { useEffect, useState } from "react";
import { MusicPlayerControl } from "./control";
import LoopIcon from "@mui/icons-material/Loop";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import RefreshIcon from "@mui/icons-material/Refresh";

const controls = [
  {
    label: "Loop",
    icon: LoopIcon,
    ariaLabel: "Toggle loop",
    bitAmount: 500,
  },
  {
    label: "Skip",
    icon: SkipNextIcon,
    ariaLabel: "Skip song",
    bitAmount: 500,
  },
];

export const MusicPlayer = () => {
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [songName, setSongName] = useState(null);
  const [artistName, setArtistName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.Twitch?.ext?.onContext((context) => {
      console.log("Context updated:", context);
    });
  }, []);

  const fetchLatestSong = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://kiriko.tv/api/spotify/now-playing");
      const data = await response.json();
      setSongName(data.songName || "Unknown Song");
      setArtistName(data.artistName || "Unknown Artist");
    } catch (error) {
      console.error("Failed to fetch latest song:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
      <main className="w-full flex flex-col items-center gap-3 justify-center">
        <div className="w-full rounded-md overflow-hidden">
          <div className="flex flex-col gap-6 p-6">
            <div className="space-y-4 text-center">
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
                Now Playing
              </div>
              <div>
                <div className="text-2xl font-semibold leading-tight text-slate-100">
                  {songName}
                </div>
                <div className="text-sm text-slate-400">{artistName}</div>
              </div>
              <button
                onClick={fetchLatestSong}
                disabled={isLoading}
                className="text-white px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition inline-flex items-center gap-2 font-medium border border-slate-600"
              >
                <RefreshIcon
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Updating..." : "Update Song"}
              </button>
            </div>

            <div className="flex gap-3">
              {controls.map((control) => (
                <MusicPlayerControl
                  key={control.label}
                  {...control}
                  active={control.label === "Loop" ? isLoopEnabled : undefined}
                  onClick={
                    control.label === "Loop"
                      ? () => setIsLoopEnabled((current) => !current)
                      : undefined
                  }
                />
              ))}
            </div>

            <div className="text-center text-sm text-slate-400">
              Use bits to turn on/off loop or skip. No refunds!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
