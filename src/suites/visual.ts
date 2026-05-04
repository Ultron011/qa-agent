import { Page } from 'playwright';
import type { TestFailure } from '../types.js';

export interface VisualReport {
  brokenImages: string[];
  overflowingElements: string[];
  viewport: { width: number; height: number };
}

export function findVisualIssues(report: VisualReport, pageUrl: string): TestFailure[] {
  const failures: TestFailure[] = [];
  for (const url of report.brokenImages) {
    failures.push({ suite: 'visual', page: pageUrl, description: `Broken image: ${url}`, raw: { url } });
  }
  for (const sel of report.overflowingElements) {
    failures.push({ suite: 'visual', page: pageUrl, description: `Element overflow viewport: ${sel}`, raw: { sel } });
  }
  return failures;
}

export async function runVisualSuite(page: Page, pageUrl: string): Promise<TestFailure[]> {
  const report = await page.evaluate(() => {
    const broken: string[] = [];
    const overflow: string[] = [];
    document.querySelectorAll('img').forEach((img) => {
      if (!img.complete || img.naturalWidth === 0) broken.push(img.src);
    });
    const vw = window.innerWidth;
    document.querySelectorAll('body *').forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.right > vw + 5) {
        const tag = el.tagName.toLowerCase();
        const cls = (el as HTMLElement).className?.toString().split(' ').filter(Boolean).slice(0, 1).join('.');
        overflow.push(cls ? `${tag}.${cls}` : tag);
      }
    });
    return {
      brokenImages: broken,
      overflowingElements: Array.from(new Set(overflow)).slice(0, 10),
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
  return findVisualIssues(report, pageUrl);
}
