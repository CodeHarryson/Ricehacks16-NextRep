export function completedSetCountAfterCompletion(completedSets: number, setCount: number): number {
  return Math.min(Math.max(0, setCount), Math.max(0, completedSets) + 1);
}
