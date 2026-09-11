/**
 * The catalogue of CAPTCHA challenge types this app implements itself
 * (no external CAPTCHA libraries). Each type has its own payload shape
 * and its own answer-checking rules — see the `Challenge` union below.
 */
export enum ChallengeType {
  MathPuzzle = 'math-puzzle',
  PatternSequence = 'pattern-sequence',
  ColorGrid = 'color-grid',
}

/** Fields every challenge shares, regardless of type. */
interface BaseChallenge {
  /** Unique id for this generated challenge instance (not the type). */
  id: string;
  type: ChallengeType;
  /** Human-readable instructions shown above the challenge UI. */
  instructions: string;
}

/** "What is 7 + 5 × 2?" — type the resulting number. */
export interface MathPuzzleChallenge extends BaseChallenge {
  type: ChallengeType.MathPuzzle;
  expression: string;
  answer: number;
}

/** "2, 4, 6, 8, ?" — type the next number in the sequence. */
export interface PatternSequenceChallenge extends BaseChallenge {
  type: ChallengeType.PatternSequence;
  sequence: number[];
  answer: number;
}

/** "Select every tile that matches this color" — classic grid-select CAPTCHA, drawn with CSS. */
export interface ColorGridChallenge extends BaseChallenge {
  type: ChallengeType.ColorGrid;
  targetColor: string;
  tiles: ColorGridTile[];
}

export interface ColorGridTile {
  id: string;
  color: string;
}

/** Discriminated union — switch on `type` to narrow to the concrete challenge shape. */
export type Challenge = MathPuzzleChallenge | PatternSequenceChallenge | ColorGridChallenge;

/**
 * The shape a user submits back for validation. Kept separate from `Challenge`
 * because the answer type differs by challenge (a number, or a set of tile ids).
 */
export type ChallengeAnswer = number | string[];
