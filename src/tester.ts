import { chromium } from 'playwright';
import type { SiteMap, RawResults, TestFailure } from './types.js';
import { runVisualSuite } from './suites/visual.js';
import { runFunctionalSuite } from './suites/functional.js';
import { runConsoleSuite } from './suites/console.js';
import { runAccessibilitySuite } from './suites/accessibility.js';
import { runPerformanceSuite } from './suites/performance.js';
import { mkdir } from 'node:fs/promises';

export function mergeFailures(arrays: TestFailure[][]): TestFailure[] {
  return arrays.flat();
}

export interface TestOptions { screenshotDir: string }

export async function runAllSuites(siteMap: SiteMap, opts: TestOptions): Promise<RawResults> {
  const start = Date.now();
  await mkdir(opts.screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const allFailures: TestFailure[] = [];

  try {
    for (const pageInfo of siteMap.pages) {
      const page = await context.newPage();
      try {
        await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        const consoleFailures = await runConsoleSuite(page, pageInfo.url);
        const visualFailures = await runVisualSuite(page, pageInfo.url);
        const a11yFailures = await runAccessibilitySuite(page, pageInfo.url);
        const perfFailures = await runPerformanceSuite(page, pageInfo.url);
        const funcFailures = await runFunctionalSuite(page, pageInfo, opts.screenshotDir);
        allFailures.push(...mergeFailures([consoleFailures, visualFailures, a11yFailures, perfFailures, funcFailures]));
      } catch (err) {
        console.warn(`Test skip ${pageInfo.url}: ${(err as Error).message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return { siteMap, failures: allFailures, durationMs: Date.now() - start };
}
