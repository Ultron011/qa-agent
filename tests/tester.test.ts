import { describe, it, expect } from 'vitest';
import { mergeFailures } from '../src/tester.js';

describe('mergeFailures', () => {
  it('flattens arrays from each suite', () => {
    const out = mergeFailures([
      [{ suite: 'visual', page: 'p', description: 'v', raw: {} }],
      [],
      [{ suite: 'console', page: 'p', description: 'c', raw: {} }],
    ]);
    expect(out).toHaveLength(2);
  });
});
