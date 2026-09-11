
export enum ChallengeType {
  MathPuzzle = 'math-puzzle',
  PatternSequence = 'pattern-sequence',
  ColorGrid = 'color-grid',
}

interface BaseChallenge {
  id: string;
  type: ChallengeType;
  instructions: string;
}

export interface MathPuzzleChallenge extends BaseChallenge {
  type: ChallengeType.MathPuzzle;
  expression: string;
  answer: number;
}

export interface PatternSequenceChallenge extends BaseChallenge {
  type: ChallengeType.PatternSequence;
  sequence: number[];
  answer: number;
}

export interface ColorGridChallenge extends BaseChallenge {
  type: ChallengeType.ColorGrid;
  targetColor: string;
  tiles: ColorGridTile[];
}

export interface ColorGridTile {
  id: string;
  color: string;
}

export type Challenge = MathPuzzleChallenge | PatternSequenceChallenge | ColorGridChallenge;


export type ChallengeAnswer = number | string[];
