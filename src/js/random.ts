export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function shuffle(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function randomFrom<T>(array: T[]): T {
  return array[randomInt(array.length)];
}
