import { describe, it, expect } from 'vitest';
import { evaluatePerf } from '../../src/suites/performance.js';

describe('evaluatePerf', () => {
  it('flags LCP > 2500 as failure', () => {
    const f = evaluatePerf({ lcp: 4000, fcp: 1000, cls: 0.05, loadMs: 2000 }, 'https://x');
    expect(f.find((x) => x.description.includes('LCP'))).toBeDefined();
  });
  it('flags CLS > 0.1 as failure', () => {
    const f = evaluatePerf({ lcp: 1000, fcp: 800, cls: 0.3, loadMs: 1500 }, 'https://x');
    expect(f.find((x) => x.description.includes('CLS'))).toBeDefined();
  });
  it('returns empty when within thresholds', () => {
    const f = evaluatePerf({ lcp: 1000, fcp: 800, cls: 0.05, loadMs: 1500 }, 'https://x');
    expect(f).toEqual([]);
  });
});
