import { describe, it, expect } from 'vitest';
import { fixBranchName, commitMessageFor } from '../src/fixer.js';

describe('fixBranchName', () => {
  it('formats branch with date', () => {
    expect(fixBranchName(new Date('2026-05-04T00:00:00Z'))).toBe('qa-fix/2026-05-04');
  });
});

describe('commitMessageFor', () => {
  it('uses bug title in commit', () => {
    const msg = commitMessageFor({
      id: 'a', severity: 'high', page: 'p', title: 'Empty submit returns 500',
      reproduction: 'r', expected: 'e', actual: 'a',
    });
    expect(msg).toBe('fix: Empty submit returns 500');
  });
});
