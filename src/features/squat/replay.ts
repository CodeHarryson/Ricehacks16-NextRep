import { cleanFiveSquats, testRubric } from './fixtures';
import { SquatAnalyzer } from './engine';

const frames = cleanFiveSquats();
const analyzer = new SquatAnalyzer({ sessionId: 'replay-session', setId: 'replay-set', selectedSide: 'left', rubric: testRubric });
const outputs = frames.map((frame) => analyzer.process(frame));
const attempts = outputs.flatMap((output) => output.attempts);
const output = {
  assumptions: { fixture: 'synthetic logic validation only', timestamps: 'monotonic milliseconds', nominalFrameRate: '10 fps', image: '1000x1000 normalized-image', side: 'left' },
  detectedReps: attempts.reduce((sum, attempt) => sum + attempt.countDelta, 0),
  currentPhase: analyzer.snapshot.phase,
  frameTimestamps: frames.map((frame) => frame.timestamp),
  phaseTrace: outputs.map((output) => output.phase),
  peakRanges: attempts.map((attempt) => attempt.peakRange),
  attempts,
  rejectedAttempts: attempts.filter((attempt) => attempt.countDelta === 0).map((attempt) => attempt.reason),
  trackingInterruptions: outputs.filter((output) => output.trackingInterrupted).length,
};
console.log(JSON.stringify(output, null, 2));
