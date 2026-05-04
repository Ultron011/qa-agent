import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeFailures } from '../src/analyzer.js';
import type { RawResults } from '../src/types.js';

vi.mock('../src/claude.js', () => ({
  runClaudeJSON: vi.fn(async () => ([
    {
      id: 'bug-1',
      severity: 'high',
      page: 'https://x/login',
      title: 'Empty submit returns 500',
      reproduction: 'Submit empty form',
      expected: 'Validation error',
      actual: 'HTTP 500',
      suspectedFile: 'src/api/auth.ts',
    },
  ])),
}));

beforeEach(() => vi.clearAllMocks());

describe('analyzeFailures', () => {
  it('returns BugList from claude JSON response', async () => {
    const raw: RawResults = {
      siteMap: { rootUrl: 'https://x', pages: [] },
      failures: [{ suite: 'console', page: 'https://x/login', description: '500 on /api', raw: {} }],
      durationMs: 1000,
    };
    const out = await analyzeFailures(raw, 'fakeRepoPath');
    expect(out.bugs).toHaveLength(1);
    expect(out.bugs[0].severity).toBe('high');
  });

  it('returns empty bug list when no failures', async () => {
    const raw: RawResults = { siteMap: { rootUrl: 'https://x', pages: [] }, failures: [], durationMs: 0 };
    const out = await analyzeFailures(raw, 'r');
    expect(out.bugs).toEqual([]);
  });
});
