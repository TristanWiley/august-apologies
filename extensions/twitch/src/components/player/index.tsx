import { MusicPlayerControl } from "./control";

export const MusicPlayer = () => {
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

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4 text-white">
      <main className="w-full max-w-5xl flex flex-col items-center gap-3 justify-center">
        <div className="w-full max-w-4xl rounded-md overflow-hidden border border-slate-700/30 bg-slate-900/40">
          <div className="flex flex-col gap-6 p-6">
            <div className="space-y-1 text-center">
              <div className="text-sm text-slate-400 uppercase tracking-[0.25em]">
                Now Playing
              </div>
              <div className="text-2xl font-semibold leading-tight text-white">
                Title Placeholder
              </div>
              <div className="text-sm text-slate-300">Artist Placeholder</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
