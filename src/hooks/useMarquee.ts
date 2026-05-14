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
    let cancelled = false;

    const overflow = text.scrollWidth - container.clientWidth;

    // Animate from `start` offset to `end` offset over the correct duration,
    // then call `onDone` after an optional end-pause.
    function animateTo(
      from: number,
      to: number,
      onDone: () => void,
      endPauseMs = 0,
    ) {
      const distance = Math.abs(to - from);
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
            rafId = setTimeout(() => {
              if (!cancelled) onDone();
            }, endPauseMs) as unknown as number;
          } else {
            onDone();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    function cycle() {
      if (cancelled) return;
      // Scroll forward to the end, pause, scroll back, pause, repeat
      animateTo(
        0,
        overflow,
        () => {
          animateTo(
            overflow,
            0,
            () => {
              if (!cancelled) {
                rafId = setTimeout(cycle, PAUSE_MS) as unknown as number;
              }
            },
            PAUSE_MS,
          );
        },
        PAUSE_MS,
      );
    }

    // Small initial delay before first scroll
    rafId = setTimeout(cycle, PAUSE_MS) as unknown as number;

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(rafId);
      if (text) text.style.transform = "";
    };
  }, [active, containerRef, textRef]);
}
