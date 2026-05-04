import { readFile } from 'node:fs/promises';
import type { Expectation } from './types.js';

export function parseExpectations(md: string): Expectation[] {
  const out: Expectation[] = [];
  let category = '';
  for (const line of md.split('\n')) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) { category = h[1].trim(); continue; }
    const b = line.match(/^[-*]\s+(.+)$/);
    if (b && category) out.push({ category, description: b[1].trim() });
  }
  return out;
}

export async function loadExpectations(filePath: string): Promise<Expectation[]> {
  const md = await readFile(filePath, 'utf8');
  return parseExpectations(md);
}
