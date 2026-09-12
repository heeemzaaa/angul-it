import { ChallengeAnswer, ChallengeType } from '../models/challenge.model';
import { CaptchaState } from '../services/captcha-state';

export function correctAnswerFor(state: CaptchaState): ChallengeAnswer {
  const challenge = state.currentStage()!.challenge;
  switch (challenge.type) {
    case ChallengeType.MathPuzzle:
    case ChallengeType.PatternSequence:
      return challenge.answer;
    case ChallengeType.ImageGrid: {
      const matchingIds: string[] = [];
      for (const tile of challenge.tiles) {
        if (tile.category === challenge.targetCategory) {
          matchingIds.push(tile.id);
        }
      }
      return matchingIds;
    }
  }
}

/** Answers every remaining stage correctly, leaving the session fully completed. */
export function completeAllStages(state: CaptchaState): void {
  while (!state.isComplete()) {
    state.submitAnswer(correctAnswerFor(state));
  }
}
