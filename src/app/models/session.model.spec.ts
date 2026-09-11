import { ChallengeType } from './challenge.model';
import { CaptchaSession, StageProgress, buildResultSummary, isSessionComplete } from './session.model';

function stage(index: number, attempts: number, status: StageProgress['status'] = 'completed'): StageProgress {
  return {
    stageIndex: index,
    status,
    attempts,
    challenge: {
      id: `challenge-${index}`,
      type: ChallengeType.MathPuzzle,
      instructions: 'Solve it.',
      expression: '1 + 1',
      answer: 2,
    },
  };
}

describe('isSessionComplete', () => {
  it('is true only when every stage is completed', () => {
    const session: CaptchaSession = {
      sessionId: 's1',
      startedAt: 0,
      currentStageIndex: 2,
      stages: [stage(0, 1), stage(1, 2), stage(2, 1)],
    };
    expect(isSessionComplete(session)).toBe(true);
  });

  it('is false when at least one stage is not completed', () => {
    const session: CaptchaSession = {
      sessionId: 's1',
      startedAt: 0,
      currentStageIndex: 1,
      stages: [stage(0, 1), stage(1, 0, 'active')],
    };
    expect(isSessionComplete(session)).toBe(false);
  });
});

describe('buildResultSummary', () => {
  it('sums attempts, computes duration, and maps per-stage details', () => {
    const session: CaptchaSession = {
      sessionId: 's1',
      startedAt: 1_000,
      completedAt: 4_500,
      currentStageIndex: 1,
      stages: [stage(0, 2), stage(1, 3)],
    };

    const summary = buildResultSummary(session);

    expect(summary.totalStages).toBe(2);
    expect(summary.totalAttempts).toBe(5);
    expect(summary.durationMs).toBe(3_500);
    expect(summary.perStage).toEqual([
      { stageIndex: 0, type: ChallengeType.MathPuzzle, attempts: 2 },
      { stageIndex: 1, type: ChallengeType.MathPuzzle, attempts: 3 },
    ]);
  });

  it('falls back to "now" for duration when completedAt is missing', () => {
    const session: CaptchaSession = {
      sessionId: 's1',
      startedAt: Date.now() - 1000,
      currentStageIndex: 0,
      stages: [stage(0, 0, 'active')],
    };

    expect(buildResultSummary(session).durationMs).toBeGreaterThanOrEqual(1000);
  });
});
