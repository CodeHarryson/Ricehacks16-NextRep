/** Emitted once AFTER the observed end of an attempt, never per frame.
 * All times are Unix milliseconds; convert the pose clock at session start. */
export type AttemptResult = {
  sessionId: string;
  setId: string;
  attemptId: string;
  startedAt: number;
  endedAt: number;
  reason: string;
  rubricVersion: string;
} & (
  | { assessable: true; completed: true; countDelta: 1; rating: 'green' | 'yellow' }
  | { assessable: true; completed: false; countDelta: 0; rating: 'red' }
  | { assessable: false; completed: false; countDelta: 0; rating: null }
);

export const attemptKey = (a: AttemptResult): string =>
  JSON.stringify([a.sessionId, a.setId, a.attemptId]);
