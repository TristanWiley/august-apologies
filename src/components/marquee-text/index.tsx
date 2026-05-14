import { useLayoutEffect, useRef, useState } from "react";
import { useMarquee } from "../../hooks/useMarquee";

interface MarqueeTextProps {
  children: string;
  className?: string;
}

export const MarqueeText = ({ children, className }: MarqueeTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useMarquee(containerRef, textRef, isOverflowing);

  useLayoutEffect(() => {
    const check = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) return setIsOverflowing(false);
      setIsOverflowing(
        text.scrollWidth > container.getBoundingClientRect().width + 1,
      );
    };

    check();
    if (typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(check);
    ro.observe(containerRef.current!);
    ro.observe(textRef.current!);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <span
        ref={textRef}
        className={`whitespace-nowrap inline-block ${className}`}
      >
        {children}
      </span>
    </div>
  );
};
