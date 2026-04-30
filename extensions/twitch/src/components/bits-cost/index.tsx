import AnimatedCheer from "../../../assets/animated-cheer.gif";

interface BitCheerAmountProps {
  bitAmount: number;
  className?: string;
}

export const BitCheerAmount: React.FC<BitCheerAmountProps> = ({
  bitAmount,
  className = "",
}) => {
  if (bitAmount < 0) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full bg-slate-700/40 px-3 py-1 text-sm font-medium text-slate-300 ${className}`}
      >
        Disabled
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-row items-center gap-2 rounded-full bg-slate-700/40 px-3 py-1 text-sm font-medium text-[#DCC7FF] ${className}`}
    >
      <img className="h-4 w-4" src={AnimatedCheer} alt="Cheer animation" />
      <span>{bitAmount}</span>
    </span>
  );
};
