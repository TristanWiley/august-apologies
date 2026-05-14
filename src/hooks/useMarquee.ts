import { useEffect } from "react";

const MARQUEE_SPEED_PX_PER_SEC = 40;
const PAUSE_MS = 2000;

export function useMarquee(
  containerRef: React.RefObject<HTMLDivElement | null>,
  textRef: React.RefObject<HTMLSpanElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function getOverflow(): number {
      if (!container || !text) return 0;
      // Force a layout read each cycle so stale values don't accumulate.
      // Use getBoundingClientRect for consistency across rendering environments.
      const containerWidth = container.getBoundingClientRect().width;
      const textWidth = text.getBoundingClientRect().width;
      return Math.max(0, textWidth - containerWidth);
    }

    function animateTo(
      from: number,
      to: number,
      onDone: () => void,
      endPauseMs = 0,
    ) {
      const distance = Math.abs(to - from);
      if (distance === 0) {
        onDone();
        return;
      }

      const duration = (distance / MARQUEE_SPEED_PX_PER_SEC) * 1000;
      const startTime = performance.now();

      function tick(now: number) {
        if (cancelled) return;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const offset = from + (to - from) * progress;
        text!.style.transform = `translateX(${-offset}px)`;

        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          if (endPauseMs > 0) {
            timeoutId = setTimeout(() => {
              if (!cancelled) onDone();
            }, endPauseMs);
          } else {
            onDone();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    function cycle() {
      if (cancelled) return;

      // Re-measure every cycle so layout changes are picked up.
      const overflow = getOverflow();

      // No overflow — text fits, nothing to animate.
      if (overflow <= 0) return;

      animateTo(
        0,
        overflow,
        () => {
          animateTo(
            overflow,
            0,
            () => {
              if (!cancelled) {
                timeoutId = setTimeout(cycle, PAUSE_MS);
              }
            },
            PAUSE_MS,
          );
        },
        PAUSE_MS,
      );
    }

    timeoutId = setTimeout(cycle, PAUSE_MS);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      if (text) text.style.transform = "";
    };
  }, [active, containerRef, textRef]);
}
