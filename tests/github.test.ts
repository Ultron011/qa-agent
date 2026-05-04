import { describe, it, expect } from 'vitest';
import { prTitle, prBody } from '../src/github.js';

describe('prTitle', () => {
  it('uses ISO date', () => {
    expect(prTitle(new Date('2026-05-04T00:00:00Z'))).toBe('fix: QA automated fixes — 2026-05-04');
  });
});

describe('prBody', () => {
  it('includes report content', () => {
    const body = prBody('# QA Report\n\nbody', 5);
    expect(body).toContain('# QA Report');
    expect(body).toContain('5 fix(es) applied');
  });
});
