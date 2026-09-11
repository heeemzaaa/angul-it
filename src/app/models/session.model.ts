import { Challenge } from './challenge.model';

export type StageStatus = 'locked' | 'active' | 'completed';

/**
 * Progress for a single stage. The generated `challenge` is stored here (not
 * regenerated on demand) so a page refresh shows the exact same puzzle the
 * user was mid-way through, instead of swapping it for a new random one.
 */
export interface StageProgress {
  stageIndex: number;
  challenge: Challenge;
  status: StageStatus;
  attempts: number;
  completedAt?: number;
}

/**
 * The single object persisted to localStorage. This is the source of truth
 * for "where is the user in the flow" — the route guard and CaptchaComponent
 * both read it to decide what to show / whether to redirect.
 */
export interface CaptchaSession {
  sessionId: string;
  startedAt: number;
  currentStageIndex: number;
  stages: StageProgress[];
  completedAt?: number;
}

/** Convenience check used throughout the app: every stage reached 'completed'. */
export function isSessionComplete(session: CaptchaSession): boolean {
  return session.stages.every((stage) => stage.status === 'completed');
}

/**
 * Derived, read-only view shown on ResultComponent. Computed from a
 * finished CaptchaSession rather than persisted separately.
 */
export interface ResultSummary {
  totalStages: number;
  totalAttempts: number;
  /** Wall-clock time from session start to completion, in milliseconds. */
  durationMs: number;
  perStage: Array<{
    stageIndex: number;
    type: Challenge['type'];
    attempts: number;
  }>;
}
