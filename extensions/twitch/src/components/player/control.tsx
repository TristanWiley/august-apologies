import { BitCheerAmount } from "../bits-cost";

export interface MusicPlayerControlProps {
  label: string;
  icon: string;
  ariaLabel: string;
  bitAmount: number;
  featured?: boolean;
}

export const MusicPlayerControl = ({
  label,
  icon,
  ariaLabel,
  bitAmount,
}: MusicPlayerControlProps) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="cursor-pointer flex flex-col items-center gap-3 rounded-md border px-4 py-4 text-center transition-colors border-[#8956FB]/40 bg-slate-800/80 hover:bg-slate-800"
    >
      <span className="flex items-center justify-center rounded-full text-lg h-8 w-8 bg-[#8956FB] text-white m-0 p-0">
        {icon}
      </span>

      <span className="text-sm font-medium text-white">{label}</span>

      <BitCheerAmount bitAmount={bitAmount} />
    </button>
  );
};
