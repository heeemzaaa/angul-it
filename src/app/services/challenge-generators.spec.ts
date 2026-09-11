import { ChallengeType } from '../models/challenge.model';
import {
  generateColorGrid,
  generateDistortedText,
  generateMathPuzzle,
  generatePatternSequence,
  generateSliderAlign,
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

    it('generates a 3x3 color grid where only tiles matching targetColor are correct', () => {
      const challenge = generateColorGrid();
      expect(challenge.type).toBe(ChallengeType.ColorGrid);
      expect(challenge.tiles).toHaveLength(9);

      const matchingIds = challenge.tiles
        .filter((tile) => tile.color === challenge.targetColor)
        .map((tile) => tile.id);
      expect(matchingIds.length).toBeGreaterThanOrEqual(2);
      expect(matchingIds.length).toBeLessThanOrEqual(4);

      expect(isAnswerCorrect(challenge, matchingIds)).toBe(true);
      expect(isAnswerCorrect(challenge, [])).toBe(false);
      expect(isAnswerCorrect(challenge, [...matchingIds, 'tile-does-not-exist'])).toBe(false);
    });

    it('generates distorted text with an unambiguous 6-character alphabet, checked case-insensitively', () => {
      const challenge = generateDistortedText();
      expect(challenge.type).toBe(ChallengeType.DistortedText);
      expect(challenge.displayText).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);

      expect(isAnswerCorrect(challenge, challenge.displayText.toLowerCase())).toBe(true);
      expect(isAnswerCorrect(challenge, `  ${challenge.displayText}  `)).toBe(true);
      expect(isAnswerCorrect(challenge, 'wrong!')).toBe(false);
    });

    it('generates a slider target within range, correct only inside tolerance', () => {
      const challenge = generateSliderAlign();
      expect(challenge.type).toBe(ChallengeType.SliderAlign);
      expect(challenge.targetPosition).toBeGreaterThanOrEqual(15);
      expect(challenge.targetPosition).toBeLessThanOrEqual(85);

      expect(isAnswerCorrect(challenge, challenge.targetPosition)).toBe(true);
      expect(isAnswerCorrect(challenge, challenge.targetPosition + challenge.tolerance)).toBe(true);
      expect(isAnswerCorrect(challenge, challenge.targetPosition + challenge.tolerance + 1)).toBe(false);
    });
  });

  describe('isAnswerCorrect', () => {
    it('rejects answers of the wrong shape instead of throwing', () => {
      const grid = generateColorGrid();
      const slider = generateSliderAlign();
      expect(isAnswerCorrect(grid, 'not-an-array')).toBe(false);
      expect(isAnswerCorrect(slider, 'not-a-number')).toBe(false);
    });
  });

  describe('pickStageTypes', () => {
    it('returns the requested count with no duplicates when count fits the catalogue', () => {
      const types = pickStageTypes(4);
      expect(types).toHaveLength(4);
      expect(new Set(types).size).toBe(4);
    });

    it('cycles through the catalogue without throwing when count exceeds it', () => {
      const allTypes = Object.values(ChallengeType).length;
      const types = pickStageTypes(allTypes + 2);
      expect(types).toHaveLength(allTypes + 2);
      types.forEach((type) => expect(Object.values(ChallengeType)).toContain(type));
    });
  });
});
