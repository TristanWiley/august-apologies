import { useEffect } from "react";
import { MusicPlayerControl } from "./control";

const controls = [
  {
    label: "Previous",
    icon: "◀",
    ariaLabel: "Previous song",
    bitAmount: 500,
  },
  {
    label: "Skip",
    icon: "⏭",
    ariaLabel: "Skip song",
    bitAmount: 500,
  },
];

export const MusicPlayer = () => {
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
                Title Placeholder
              </div>
              <div className="text-sm text-slate-100">Artist Placeholder</div>
            </div>

            <div className="flex gap-3">
              {controls.map((control) => (
                <MusicPlayerControl key={control.label} {...control} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
