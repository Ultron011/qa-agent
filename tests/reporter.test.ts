import { describe, it, expect } from 'vitest';
import { renderReport } from '../src/reporter.js';
import type { BugList, SiteMap } from '../src/types.js';

describe('renderReport', () => {
  it('produces summary counts by severity', () => {
    const siteMap: SiteMap = { rootUrl: 'https://x', pages: [{ url: 'https://x', title: 't', elements: [] }] };
    const list: BugList = {
      bugs: [
        { id: 'a', severity: 'critical', page: 'https://x', title: 'A', reproduction: 'r', expected: 'e', actual: 'a' },
        { id: 'b', severity: 'high', page: 'https://x', title: 'B', reproduction: 'r', expected: 'e', actual: 'a' },
        { id: 'c', severity: 'high', page: 'https://x', title: 'C', reproduction: 'r', expected: 'e', actual: 'a' },
      ],
      totalDurationMs: 12000,
    };
    const md = renderReport(siteMap, list, new Date('2026-05-04T14:32:00Z'));
    expect(md).toContain('Pages tested: 1');
    expect(md).toContain('Bugs found: 3');
    expect(md).toContain('1 critical');
    expect(md).toContain('2 high');
    expect(md).toContain('## Critical');
    expect(md).toContain('### A');
  });

  it('renders empty report cleanly', () => {
    const siteMap: SiteMap = { rootUrl: 'https://x', pages: [] };
    const md = renderReport(siteMap, { bugs: [], totalDurationMs: 0 }, new Date());
    expect(md).toContain('Bugs found: 0');
  });
});
