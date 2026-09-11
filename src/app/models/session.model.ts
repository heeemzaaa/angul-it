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
