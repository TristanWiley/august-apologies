import { useEffect, useState } from "react";
import { MusicPlayerControl } from "./control";
import LoopIcon from "@mui/icons-material/Loop";
import SkipNextIcon from "@mui/icons-material/SkipNext";

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

  useEffect(() => {
    window.Twitch?.ext?.onContext((context) => {
      console.log("Context updated:", context);
    });
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
      <main className="w-full flex flex-col items-center gap-3 justify-center">
        <div className="w-full rounded-md overflow-hidden">
          <div className="flex flex-col gap-6 p-6">
            <div className="space-y-1 text-center">
              <div className="text-sm uppercase tracking-[0.25em]">
                Now Playing
              </div>
              <div className="text-2xl font-semibold leading-tight text-slate-100">
                Never Gonna Give You Up
              </div>
              <div className="text-sm text-slate-100">Rick Astley</div>
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
              Use bits to loop or skip. First redeem wins!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
