import { ChallengeAnswer, ChallengeType } from '../models/challenge.model';
import { CaptchaState } from '../services/captcha-state';

export function correctAnswerFor(state: CaptchaState): ChallengeAnswer {
  const challenge = state.currentStage()!.challenge;
  switch (challenge.type) {
    case ChallengeType.MathPuzzle:
    case ChallengeType.PatternSequence:
      return challenge.answer;
    case ChallengeType.ColorGrid:
      return challenge.tiles.filter((t) => t.color === challenge.targetColor).map((t) => t.id);
  }
}

/** Answers every remaining stage correctly, leaving the session fully completed. */
export function completeAllStages(state: CaptchaState): void {
  while (!state.isComplete()) {
    state.submitAnswer(correctAnswerFor(state));
  }
}
