export interface PollTarget { tick(): Promise<void>; readonly isFinal: boolean; }
export interface TimerApi { setInterval(callback: () => void, ms: number): unknown; clearInterval(handle: unknown): void; }

const defaultTimers: TimerApi = {
  setInterval: (callback, ms) => setInterval(callback, ms),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

/**
 * Drives a poll target on an interval. Polling pauses while the app is backgrounded, refreshes immediately
 * when it returns to the foreground, and stops scheduling once the target reports a final state.
 * Overlap protection lives in the target (SyncPoller joins in-flight requests).
 */
export class PollScheduler {
  private handle: unknown = null;
  private started = false;
  private appActive = true;

  constructor(private readonly target: PollTarget, private readonly intervalMs: number, private readonly timers: TimerApi = defaultTimers) {}

  get isScheduled(): boolean { return this.handle !== null; }

  start(): void {
    this.started = true;
    this.resume();
  }

  stop(): void {
    this.started = false;
    this.clear();
  }

  setAppActive(active: boolean): void {
    if (active === this.appActive) return;
    this.appActive = active;
    if (!active) this.clear();
    else if (this.started) this.resume();
  }

  private resume(): void {
    if (!this.started || !this.appActive || this.target.isFinal) { this.clear(); return; }
    void this.target.tick().then(() => { if (this.target.isFinal) this.clear(); });
    if (this.handle !== null) return;
    this.handle = this.timers.setInterval(() => {
      if (this.target.isFinal) { this.clear(); return; }
      void this.target.tick();
    }, this.intervalMs);
  }

  private clear(): void {
    if (this.handle !== null) this.timers.clearInterval(this.handle);
    this.handle = null;
  }
}
