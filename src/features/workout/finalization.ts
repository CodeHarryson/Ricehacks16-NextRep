export type ResultStatus = 'not_started' | 'saving' | 'saved' | 'submission_pending' | 'submitted' | 'failed';
export type FinalizationEvent = 'begin' | 'local_saved' | 'submission_started' | 'submitted' | 'failed';
export function resultStatusAfter(status: ResultStatus, event: FinalizationEvent): ResultStatus {
  if (event === 'begin' && (status === 'not_started' || status === 'failed')) return 'saving';
  if (event === 'local_saved' && status === 'saving') return 'saved';
  if (event === 'submission_started' && (status === 'saved' || status === 'submission_pending')) return 'submission_pending';
  if (event === 'submitted' && status === 'submission_pending') return 'submitted';
  if (event === 'failed' && status !== 'submitted') return 'failed';
  return status;
}
