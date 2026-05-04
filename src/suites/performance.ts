import { Page } from 'playwright';
import type { TestFailure } from '../types.js';

export interface PerfMetrics { lcp: number; fcp: number; cls: number; loadMs: number }

const THRESHOLDS = { lcp: 2500, fcp: 1800, cls: 0.1, loadMs: 5000 };

export function evaluatePerf(m: PerfMetrics, pageUrl: string): TestFailure[] {
  const failures: TestFailure[] = [];
  if (m.lcp > THRESHOLDS.lcp) {
    failures.push({ suite: 'performance', page: pageUrl, description: `LCP ${m.lcp}ms exceeds ${THRESHOLDS.lcp}ms`, raw: m });
  }
  if (m.fcp > THRESHOLDS.fcp) {
    failures.push({ suite: 'performance', page: pageUrl, description: `FCP ${m.fcp}ms exceeds ${THRESHOLDS.fcp}ms`, raw: m });
  }
  if (m.cls > THRESHOLDS.cls) {
    failures.push({ suite: 'performance', page: pageUrl, description: `CLS ${m.cls.toFixed(3)} exceeds ${THRESHOLDS.cls}`, raw: m });
  }
  if (m.loadMs > THRESHOLDS.loadMs) {
    failures.push({ suite: 'performance', page: pageUrl, description: `Load ${m.loadMs}ms exceeds ${THRESHOLDS.loadMs}ms`, raw: m });
  }
  return failures;
}

export async function runPerformanceSuite(page: Page, pageUrl: string): Promise<TestFailure[]> {
  const start = Date.now();
  const metrics = await page.evaluate(() => {
    return new Promise<PerfMetrics>((resolve) => {
      const out: PerfMetrics = { lcp: 0, fcp: 0, cls: 0, loadMs: 0 };
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.entryType === 'largest-contentful-paint') out.lcp = e.startTime;
            if (e.entryType === 'paint' && (e as any).name === 'first-contentful-paint') out.fcp = e.startTime;
            if (e.entryType === 'layout-shift') {
              const ls = e as any;
              if (!ls.hadRecentInput) out.cls += ls.value ?? 0;
            }
          }
        }).observe({ entryTypes: ['largest-contentful-paint', 'paint', 'layout-shift'] });
        setTimeout(() => resolve(out), 2500);
      } catch {
        resolve(out);
      }
    });
  });
  metrics.loadMs = Date.now() - start;
  return evaluatePerf(metrics, pageUrl);
}
