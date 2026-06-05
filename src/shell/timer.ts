/**
 * Timer - Countdown timer for timed quiz mode
 * Imperative Shell - uses setInterval for side effects
 */

import type { TimerConfig } from '../types';

export interface Timer {
  start: () => void;
  stop: () => void;
  reset: () => void;
  isRunning: () => boolean;
}

export function createTimer(config: TimerConfig): Timer {
  let remaining = config.duration;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function tick(): void {
    remaining--;
    config.onTick?.(remaining);

    if (remaining <= 0) {
      stop();
      config.onComplete?.();
    }
  }

  function start(): void {
    if (intervalId !== null) return;
    intervalId = setInterval(tick, 1000);
  }

  function stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function reset(): void {
    stop();
    remaining = config.duration;
    config.onTick?.(remaining);
  }

  return { start, stop, reset, isRunning: () => intervalId !== null };
}
