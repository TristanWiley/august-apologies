import type { ElementType } from "react";
import { BitCheerAmount } from "../bits-cost";

export interface MusicPlayerControlProps {
  label: string;
  icon: ElementType;
  ariaLabel: string;
  bitAmount: number;
  featured?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export const MusicPlayerControl = ({
  label,
  icon,
  ariaLabel,
  bitAmount,
  active = false,
  onClick,
}: MusicPlayerControlProps) => {
  const Icon = icon;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className={`cursor-pointer flex flex-col items-center gap-3 rounded-md border px-4 py-4 text-center transition-colors ${
        active
          ? "border-[#8956FB] bg-[#8956FB]/20"
          : "border-[#8956FB]/40 bg-slate-800/80 hover:bg-slate-800"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8956FB] text-white">
        <Icon className="block h-5 w-5" />
      </span>

      <span className="text-sm font-medium text-white">
        {label}
        {label === "Loop" ? (active ? " On" : " Off") : ""}
      </span>

      <BitCheerAmount bitAmount={bitAmount} />
    </button>
  );
};
