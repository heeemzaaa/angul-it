import {
  Challenge,
  ChallengeAnswer,
  ChallengeType,
  ColorGridChallenge,
  ColorGridTile,
  DistortedTextChallenge,
  MathPuzzleChallenge,
  PatternSequenceChallenge,
  SliderAlignChallenge,
} from '../models/challenge.model';

/** Inclusive random integer in [min, max]. */
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

const GRID_PALETTE = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
const GRID_SIZE = 9;

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

// Excludes visually ambiguous characters (0/O, 1/I) since the whole point is reading distortion.
const TEXT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TEXT_LENGTH = 6;

export function generateDistortedText(): DistortedTextChallenge {
  let text = '';
  for (let i = 0; i < TEXT_LENGTH; i++) {
    text += randomItem(TEXT_ALPHABET.split(''));
  }
  return {
    id: newChallengeId(),
    type: ChallengeType.DistortedText,
    instructions: 'Type the distorted text exactly as shown.',
    displayText: text,
    answer: text,
  };
}

export function generateSliderAlign(): SliderAlignChallenge {
  return {
    id: newChallengeId(),
    type: ChallengeType.SliderAlign,
    instructions: 'Drag the slider until it locks into the target zone.',
    targetPosition: randomInt(15, 85),
    tolerance: 3,
  };
}

const GENERATORS: Record<ChallengeType, () => Challenge> = {
  [ChallengeType.MathPuzzle]: generateMathPuzzle,
  [ChallengeType.PatternSequence]: generatePatternSequence,
  [ChallengeType.ColorGrid]: generateColorGrid,
  [ChallengeType.DistortedText]: generateDistortedText,
  [ChallengeType.SliderAlign]: generateSliderAlign,
};

export function generateChallenge(type: ChallengeType): Challenge {
  return GENERATORS[type]();
}

/**
 * Picks `count` challenge types for a session, shuffled so stage order (and
 * which types appear) varies between sessions — the randomized-diversity bonus.
 * Cycles through the catalogue without immediate repeats if `count` exceeds it.
 */
export function pickStageTypes(count: number): ChallengeType[] {
  const shuffled = Object.values(ChallengeType).sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

/** Single source of truth for "was this answer right" — one case per challenge type. */
export function isAnswerCorrect(challenge: Challenge, answer: ChallengeAnswer): boolean {
  switch (challenge.type) {
    case ChallengeType.MathPuzzle:
    case ChallengeType.PatternSequence:
      return Number(answer) === challenge.answer;

    case ChallengeType.DistortedText:
      return (
        typeof answer === 'string' &&
        answer.trim().toLowerCase() === challenge.answer.toLowerCase()
      );

    case ChallengeType.ColorGrid: {
      if (!Array.isArray(answer)) return false;
      const correctIds = challenge.tiles
        .filter((tile) => tile.color === challenge.targetColor)
        .map((tile) => tile.id);
      const selected = new Set(answer);
      return correctIds.length === selected.size && correctIds.every((id) => selected.has(id));
    }

    case ChallengeType.SliderAlign:
      return typeof answer === 'number' && Math.abs(answer - challenge.targetPosition) <= challenge.tolerance;
  }
}
