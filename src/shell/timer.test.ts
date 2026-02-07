import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimer } from './timer';

describe('timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call onTick each second with remaining time', () => {
    const onTick = vi.fn();
    const timer = createTimer({ duration: 5, onTick });

    timer.start();
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledWith(4);

    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledWith(3);
  });

  it('should call onComplete when time reaches 0', () => {
    const onComplete = vi.fn();
    const timer = createTimer({ duration: 3, onComplete });

    timer.start();
    vi.advanceTimersByTime(3000);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('should stop ticking after completion', () => {
    const onTick = vi.fn();
    const onComplete = vi.fn();
    const timer = createTimer({ duration: 2, onTick, onComplete });

    timer.start();
    vi.advanceTimersByTime(2000);
    expect(onComplete).toHaveBeenCalledOnce();

    onTick.mockClear();
    vi.advanceTimersByTime(2000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('should report isRunning correctly', () => {
    const timer = createTimer({ duration: 10 });

    expect(timer.isRunning()).toBe(false);
    timer.start();
    expect(timer.isRunning()).toBe(true);
    timer.stop();
    expect(timer.isRunning()).toBe(false);
  });

  it('should stop ticking when stop is called', () => {
    const onTick = vi.fn();
    const timer = createTimer({ duration: 10, onTick });

    timer.start();
    vi.advanceTimersByTime(2000);
    expect(onTick).toHaveBeenCalledTimes(2);

    timer.stop();
    onTick.mockClear();
    vi.advanceTimersByTime(3000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('should reset remaining time and call onTick', () => {
    const onTick = vi.fn();
    const timer = createTimer({ duration: 10, onTick });

    timer.start();
    vi.advanceTimersByTime(5000);
    expect(onTick).toHaveBeenLastCalledWith(5);

    timer.reset();
    expect(timer.isRunning()).toBe(false);
    expect(onTick).toHaveBeenLastCalledWith(10);
  });

  it('should restart correctly after reset', () => {
    const onTick = vi.fn();
    const timer = createTimer({ duration: 3, onTick });

    timer.start();
    vi.advanceTimersByTime(2000);
    timer.reset();

    timer.start();
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenLastCalledWith(2);
  });

  it('should not double-start if already running', () => {
    const onTick = vi.fn();
    const timer = createTimer({ duration: 10, onTick });

    timer.start();
    timer.start(); // second start should be no-op
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('should work without optional callbacks', () => {
    const timer = createTimer({ duration: 3 });

    timer.start();
    // Should not throw
    expect(() => vi.advanceTimersByTime(3000)).not.toThrow();
    expect(timer.isRunning()).toBe(false);
  });
});
