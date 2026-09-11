import {
  Challenge,
  ChallengeAnswer,
  ChallengeType,
  ColorGridChallenge,
  ColorGridTile,
  MathPuzzleChallenge,
  PatternSequenceChallenge,
} from '../models/challenge.model';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function newChallengeId(): string {
  return crypto.randomUUID();
}

export function generateMathPuzzle(): MathPuzzleChallenge {
  const a = randomInt(2, 20);
  const b = randomInt(2, 20);
  const c = randomInt(2, 9);
  const variants = [
    { expression: `${a} + ${b} × ${c}`, answer: a + b * c },
    { expression: `${a} × ${c} - ${b}`, answer: a * c - b },
    { expression: `(${a} + ${b}) × ${c}`, answer: (a + b) * c },
    { expression: `${a} - ${b} + ${c}`, answer: a - b + c },
  ];
  const { expression, answer } = randomItem(variants);
  return {
    id: newChallengeId(),
    type: ChallengeType.MathPuzzle,
    instructions: 'Solve the expression and type the result.',
    expression,
    answer,
  };
}

export function generatePatternSequence(): PatternSequenceChallenge {
  const start = randomInt(1, 10);
  const step = randomInt(2, 6);
  const sequence = Array.from({ length: 4 }, (_, i) => start + i * step);
  const answer = start + 4 * step;
  return {
    id: newChallengeId(),
    type: ChallengeType.PatternSequence,
    instructions: 'Type the next number in the sequence.',
    sequence,
    answer,
  };
}

const GRID_COLORS: Record<string, string> = {
  '#e74c3c': 'red',
  '#3498db': 'blue',
  '#2ecc71': 'green',
  '#f1c40f': 'yellow',
  '#9b59b6': 'purple',
  '#e67e22': 'orange',
};
const GRID_PALETTE = Object.keys(GRID_COLORS);
const GRID_SIZE = 9;

export function colorName(hex: string): string {
  return GRID_COLORS[hex] ?? hex;
}

export function generateColorGrid(): ColorGridChallenge {
  const targetColor = randomItem(GRID_PALETTE);
  const matchCount = randomInt(2, 4);

  const matchIndexes = new Set<number>();
  while (matchIndexes.size < matchCount) {
    matchIndexes.add(randomInt(0, GRID_SIZE - 1));
  }

  const otherColors = GRID_PALETTE.filter((color) => color !== targetColor);
  const tiles: ColorGridTile[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
    id: `tile-${i}`,
    color: matchIndexes.has(i) ? targetColor : randomItem(otherColors),
  }));

  return {
    id: newChallengeId(),
    type: ChallengeType.ColorGrid,
    instructions: 'Select every tile that matches the highlighted color.',
    targetColor,
    tiles,
  };
}

const GENERATORS: Record<ChallengeType, () => Challenge> = {
  [ChallengeType.MathPuzzle]: generateMathPuzzle,
  [ChallengeType.PatternSequence]: generatePatternSequence,
  [ChallengeType.ColorGrid]: generateColorGrid,
};

export function generateChallenge(type: ChallengeType): Challenge {
  return GENERATORS[type]();
}

export function pickStageTypes(): ChallengeType[] {
  return Object.values(ChallengeType).sort(() => Math.random() - 0.5);
}

export function isAnswerCorrect(challenge: Challenge, answer: ChallengeAnswer): boolean {
  switch (challenge.type) {
    case ChallengeType.MathPuzzle:
    case ChallengeType.PatternSequence:
      return Number(answer) === challenge.answer;

    case ChallengeType.ColorGrid: {
      if (!Array.isArray(answer)) return false;
      const correctIds = challenge.tiles
        .filter((tile) => tile.color === challenge.targetColor)
        .map((tile) => tile.id);
      const selected = new Set(answer);
      return correctIds.length === selected.size && correctIds.every((id) => selected.has(id));
    }
  }
}
