export function parseTsv(content: string): string[][] {
  const result: string[][] = [];
  const lines = content.split(/\n/);
  for (const rawLine of lines) {
    let line = rawLine.trim();
    const commentStart = line.indexOf("#");
    if (commentStart >= 0) {
      line = line.substring(0, commentStart).trim();
    }
    if (line.length == 0) {
      continue;
    }
    const entries = line.split(/\t+|  +/);
    if (!entries || entries.length !== 2) {
      throw new Error(`Error while parsing line '${line}'!`);
    }
    result.push(entries);
  }
  return result;
}
