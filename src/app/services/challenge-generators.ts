import {
  Challenge,
  ChallengeAnswer,
  ChallengeType,
  ImageGridChallenge,
  ImageGridTile,
  MathPuzzleChallenge,
  PatternSequenceChallenge,
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


const IMAGE_CATEGORIES: Record<string, string[]> = {
  cat: ['/images/cat/1.jpg', '/images/cat/2.jpg', '/images/cat/3.jpg'],
  dog: ['/images/dog/1.jpg', '/images/dog/2.jpg', '/images/dog/3.jpg'],
  car: ['/images/car/1.jpg', '/images/car/2.jpg', '/images/car/3.jpg'],
  tree: ['/images/tree/1.jpg', '/images/tree/2.jpg', '/images/tree/3.jpg'],
  house: ['/images/house/1.jpg', '/images/house/2.jpg', '/images/house/3.jpg'],
  flower: ['/images/flower/1.jpg', '/images/flower/2.jpg', '/images/flower/3.jpg'],
};
const CATEGORY_NAMES = Object.keys(IMAGE_CATEGORIES);
const GRID_SIZE = 9;

function randomImageFor(category: string): string {
  return randomItem(IMAGE_CATEGORIES[category]);
}

export function generateImageGrid(): ImageGridChallenge {
  const targetCategory = randomItem(CATEGORY_NAMES);
  const matchCount = randomInt(2, 4);

  const matchIndexes = new Set<number>();
  while (matchIndexes.size < matchCount) {
    matchIndexes.add(randomInt(0, GRID_SIZE - 1));
  }

  const otherCategories = CATEGORY_NAMES.filter((category) => category !== targetCategory);
  const tiles: ImageGridTile[] = Array.from({ length: GRID_SIZE }, (_, i) => {
    const category = matchIndexes.has(i) ? targetCategory : randomItem(otherCategories);
    return { id: `tile-${i}`, category, imageUrl: randomImageFor(category) };
  });

  return {
    id: newChallengeId(),
    type: ChallengeType.ImageGrid,
    instructions: 'Select every image that matches the highlighted one.',
    targetCategory,
    targetImageUrl: randomImageFor(targetCategory),
    tiles,
  };
}

const GENERATORS: Record<ChallengeType, () => Challenge> = {
  [ChallengeType.MathPuzzle]: generateMathPuzzle,
  [ChallengeType.PatternSequence]: generatePatternSequence,
  [ChallengeType.ImageGrid]: generateImageGrid,
};

export function generateChallenge(type: ChallengeType): Challenge {
  return GENERATORS[type]();
}

/** All challenge types, shuffled — one stage per type, in a random order each session. */
export function pickStageTypes(): ChallengeType[] {
  return Object.values(ChallengeType).sort(() => Math.random() - 0.5);
}

/** Single source of truth for "was this answer right" — one case per challenge type. */
export function isAnswerCorrect(challenge: Challenge, answer: ChallengeAnswer): boolean {
  switch (challenge.type) {
    case ChallengeType.MathPuzzle:
    case ChallengeType.PatternSequence:
      return Number(answer) === challenge.answer;

    case ChallengeType.ImageGrid: {
      if (!Array.isArray(answer)) return false;
      const correctIds = challenge.tiles
        .filter((tile) => tile.category === challenge.targetCategory)
        .map((tile) => tile.id);
      const selected = new Set(answer);
      return correctIds.length === selected.size && correctIds.every((id) => selected.has(id));
    }
  }
}
