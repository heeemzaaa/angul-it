import { Challenge } from './challenge.model';

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
  return session.stages.every((stage) => stage.status === 'completed');
}


export interface ResultSummary {
  totalStages: number;
  totalAttempts: number;
  durationMs: number;
  perStage: Array<{
    stageIndex: number;
    type: Challenge['type'];
    attempts: number;
  }>;
}

export function buildResultSummary(session: CaptchaSession): ResultSummary {
  return {
    totalStages: session.stages.length,
    totalAttempts: session.stages.reduce((sum, stage) => sum + stage.attempts, 0),
    durationMs: (session.completedAt ?? Date.now()) - session.startedAt,
    perStage: session.stages.map((stage) => ({
      stageIndex: stage.stageIndex,
      type: stage.challenge.type,
      attempts: stage.attempts,
    })),
  };
}
