import { Challenge, ChallengeType } from './challenge.model';

export type StageStatus = 'locked' | 'active' | 'completed';

export interface StageProgress {
  stageIndex: number;
  challenge: Challenge;
  status: StageStatus;
  attempts: number;
  completedAt?: number;
}

export interface CaptchaSession {
  sessionId: string;
  startedAt: number;
  currentStageIndex: number;
  stages: StageProgress[];
  completedAt?: number;
}

export function isSessionComplete(session: CaptchaSession): boolean {
  for (const stage of session.stages) {
    if (stage.status !== 'completed') {
      return false;
    }
  }
  return true;
}

export interface StageSummary {
  stageIndex: number;
  type: ChallengeType;
  attempts: number;
}

export interface ResultSummary {
  totalStages: number;
  totalAttempts: number;
  durationMs: number;
  perStage: StageSummary[];
}

export function buildResultSummary(session: CaptchaSession): ResultSummary {
  let totalAttempts = 0;
  const perStage: StageSummary[] = [];

  for (const stage of session.stages) {
    totalAttempts += stage.attempts;
    perStage.push({
      stageIndex: stage.stageIndex,
      type: stage.challenge.type,
      attempts: stage.attempts,
    });
  }

  return {
    totalStages: session.stages.length,
    totalAttempts,
    durationMs: (session.completedAt ?? Date.now()) - session.startedAt,
    perStage,
  };
}
