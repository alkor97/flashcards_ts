export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function randomFrom<T>(array: T[]): T {
  return array[randomInt(array.length)];
}
