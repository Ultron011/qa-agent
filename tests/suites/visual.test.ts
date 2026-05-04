import { describe, it, expect } from 'vitest';
import { findVisualIssues } from '../../src/suites/visual.js';

describe('findVisualIssues', () => {
  it('flags broken images', () => {
    const out = findVisualIssues({
      brokenImages: ['https://x/missing.png'],
      overflowingElements: [],
      viewport: { width: 1280, height: 720 },
    }, 'https://x');
    expect(out.some((f) => f.description.toLowerCase().includes('broken image'))).toBe(true);
  });
  it('flags viewport overflow', () => {
    const out = findVisualIssues({
      brokenImages: [],
      overflowingElements: ['div.banner'],
      viewport: { width: 1280, height: 720 },
    }, 'https://x');
    expect(out.some((f) => f.description.toLowerCase().includes('overflow'))).toBe(true);
  });
});
