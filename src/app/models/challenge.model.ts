
export enum ChallengeType {
  MathPuzzle = 'math-puzzle',
  PatternSequence = 'pattern-sequence',
  ImageGrid = 'image-grid',
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


export interface ImageGridChallenge extends BaseChallenge {
  type: ChallengeType.ImageGrid;
  targetCategory: string;
  tiles: ImageGridTile[];
}

export interface ImageGridTile {
  id: string;
  category: string;
  imageUrl: string;
}

export type Challenge = MathPuzzleChallenge | PatternSequenceChallenge | ImageGridChallenge;


export type ChallengeAnswer = number | string[];
