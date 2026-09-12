import { ChallengeType } from '../models/challenge.model';
import {
  generateImageGrid,
  generateMathPuzzle,
  generatePatternSequence,
  isAnswerCorrect,
  pickStageTypes,
} from './challenge-generators';

describe('challenge-generators', () => {
  describe('generators', () => {
    it('generates a math puzzle whose own answer satisfies isAnswerCorrect', () => {
      const challenge = generateMathPuzzle();
      expect(challenge.type).toBe(ChallengeType.MathPuzzle);
      expect(isAnswerCorrect(challenge, challenge.answer)).toBe(true);
      expect(isAnswerCorrect(challenge, challenge.answer + 1)).toBe(false);
    });

    it('generates a 4-number arithmetic sequence whose answer continues the progression', () => {
      const challenge = generatePatternSequence();
      expect(challenge.type).toBe(ChallengeType.PatternSequence);
      expect(challenge.sequence).toHaveLength(4);

      const step = challenge.sequence[1] - challenge.sequence[0];
      for (let i = 2; i < challenge.sequence.length; i++) {
        expect(challenge.sequence[i] - challenge.sequence[i - 1]).toBe(step);
      }
      expect(challenge.answer).toBe(challenge.sequence[3] + step);
      expect(isAnswerCorrect(challenge, challenge.answer)).toBe(true);
    });

    it('generates a 3x3 image grid where only tiles matching targetCategory are correct', () => {
      const challenge = generateImageGrid();
      expect(challenge.type).toBe(ChallengeType.ImageGrid);
      expect(challenge.tiles).toHaveLength(9);
      expect(challenge.targetCategory).toBeTruthy();
      expect(challenge.instructions).toContain(challenge.targetCategory);
      challenge.tiles.forEach((tile) => expect(tile.imageUrl).toBeTruthy());

      const matchingIds = challenge.tiles
        .filter((tile) => tile.category === challenge.targetCategory)
        .map((tile) => tile.id);
      expect(matchingIds.length).toBeGreaterThanOrEqual(2);
      expect(matchingIds.length).toBeLessThanOrEqual(4);

      expect(isAnswerCorrect(challenge, matchingIds)).toBe(true);
      expect(isAnswerCorrect(challenge, [])).toBe(false);
      expect(isAnswerCorrect(challenge, [...matchingIds, 'tile-does-not-exist'])).toBe(false);
    });
  });

  describe('isAnswerCorrect', () => {
    it('rejects an answer shaped for the wrong challenge type instead of throwing', () => {
      const grid = generateImageGrid();
      const math = generateMathPuzzle();
      expect(isAnswerCorrect(grid, 42)).toBe(false);
      expect(isAnswerCorrect(math, ['not-a-number'])).toBe(false);
    });
  });

  describe('pickStageTypes', () => {
    it('returns every challenge type exactly once, in some order', () => {
      const types = pickStageTypes();
      expect(new Set(types)).toEqual(new Set(Object.values(ChallengeType)));
      expect(types).toHaveLength(Object.values(ChallengeType).length);
    });
  });
});
