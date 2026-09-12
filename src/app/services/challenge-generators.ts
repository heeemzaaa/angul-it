import {
  Challenge,
  ChallengeAnswer,
  ChallengeType,
  ImageGridChallenge,
  ImageGridTile,
  MathPuzzleChallenge,
  PatternSequenceChallenge,
} from '../models/challenge.model';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newChallengeId(): string {
  return crypto.randomUUID();
}

export function generateMathPuzzle(): MathPuzzleChallenge {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const c = randomInt(2, 9);

  const variants = [
    { expression: `${a} + ${b} × ${c}`, answer: a + b * c },
    { expression: `${a} × ${c} - ${b}`, answer: a * c - b },
    { expression: `(${a} + ${b}) × ${c}`, answer: (a + b) * c },
    { expression: `${a} - ${b} + ${c}`, answer: a - b + c },
  ];
  const chosen = variants[randomInt(0, variants.length - 1)];

  return {
    id: newChallengeId(),
    type: ChallengeType.MathPuzzle,
    instructions: 'Solve the expression and type the result.',
    expression: chosen.expression,
    answer: chosen.answer,
  };
}

export function generatePatternSequence(): PatternSequenceChallenge {
  const start = randomInt(1, 10);
  const step = randomInt(2, 10);

  const sequence: number[] = [];
  for (let i = 0; i < 4; i++) {
    sequence.push(start + i * step);
  }
  const answer = start + 4 * step;

  return {
    id: newChallengeId(),
    type: ChallengeType.PatternSequence,
    instructions: 'Type the next number in the sequence.',
    sequence,
    answer,
  };
}


const CATEGORIES = [
  { name: 'cat', images: ['/images/cat/1.jpg', '/images/cat/2.jpg', '/images/cat/3.jpg'] },
  { name: 'dog', images: ['/images/dog/1.jpg', '/images/dog/2.jpg', '/images/dog/3.jpg'] },
  { name: 'car', images: ['/images/car/1.jpg', '/images/car/2.jpg', '/images/car/3.jpg'] },
  { name: 'tree', images: ['/images/tree/1.jpg', '/images/tree/2.jpg', '/images/tree/3.jpg'] },
  { name: 'house', images: ['/images/house/1.jpg', '/images/house/2.jpg', '/images/house/3.jpg'] },
  { name: 'flower', images: ['/images/flower/1.jpg', '/images/flower/2.jpg', '/images/flower/3.jpg'] },
];
const GRID_SIZE = 9;

export function generateImageGrid(): ImageGridChallenge {
  const targetCategory = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];

  const matchCount = randomInt(2, 4);
  const matchTileIndexes: number[] = [];
  while (matchTileIndexes.length < matchCount) {
    const index = randomInt(0, GRID_SIZE - 1);
    if (!matchTileIndexes.includes(index)) {
      matchTileIndexes.push(index);
    }
  }

  const tiles: ImageGridTile[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    let category = targetCategory;

    if (!matchTileIndexes.includes(i)) {
      category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
      while (category.name === targetCategory.name) {
        category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
      }
    }

    const image = category.images[randomInt(0, category.images.length - 1)];
    tiles.push({ id: `tile-${i}`, category: category.name, imageUrl: image });
  }

  return {
    id: newChallengeId(),
    type: ChallengeType.ImageGrid,
    instructions: `Select every image of a ${targetCategory.name}.`,
    targetCategory: targetCategory.name,
    tiles,
  };
}

export function generateChallenge(type: ChallengeType): Challenge {
  if (type === ChallengeType.MathPuzzle) {
    return generateMathPuzzle();
  }
  if (type === ChallengeType.PatternSequence) {
    return generatePatternSequence();
  }
  return generateImageGrid();
}

export function pickStageTypes(): ChallengeType[] {
  const types = Object.values(ChallengeType);

  for (let i = types.length - 1; i > 0; i--) {
    const randomIndex = randomInt(0, i);
    const temp = types[i];
    types[i] = types[randomIndex];
    types[randomIndex] = temp;
  }

  return types;
}

export function isAnswerCorrect(challenge: Challenge, answer: ChallengeAnswer): boolean {
  if (challenge.type === ChallengeType.MathPuzzle || challenge.type === ChallengeType.PatternSequence) {
    return Number(answer) === challenge.answer;
  }

  if (!Array.isArray(answer)) {
    return false;
  }

  const correctIds: string[] = [];
  for (const tile of challenge.tiles) {
    if (tile.category === challenge.targetCategory) {
      correctIds.push(tile.id);
    }
  }

  if (answer.length !== correctIds.length) {
    return false;
  }
  for (const id of answer) {
    if (!correctIds.includes(id)) {
      return false;
    }
  }
  return true;
}
