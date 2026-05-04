import { Page } from 'playwright';
import type { TestFailure, PageInfo, InteractiveElement } from '../types.js';

const DANGEROUS = /\b(log\s*out|sign\s*out|delete|remove|destroy|cancel\s*subscription|deactivate)\b/i;

export function isSafeToClick(el: InteractiveElement): boolean {
  const label = (el.label ?? '').toLowerCase();
  return !DANGEROUS.test(label);
}

export async function runFunctionalSuite(
  page: Page,
  pageInfo: PageInfo,
  screenshotDir: string
): Promise<TestFailure[]> {
  const failures: TestFailure[] = [];
  const baseUrl = pageInfo.url;

  // Test forms with empty submission
  for (const el of pageInfo.elements.filter((e) => e.type === 'form')) {
    try {
      const form = await page.$(el.selector);
      if (!form) continue;
      const submit = await form.$('button[type="submit"], input[type="submit"]');
      if (!submit) continue;

      const responsePromise = page.waitForResponse(() => true, { timeout: 5000 }).catch(() => null);
      await submit.click({ trial: false }).catch(() => {});
      const resp = await responsePromise;
      if (resp && resp.status() >= 500) {
        const ssPath = `${screenshotDir}/form-empty-${Date.now()}.png`;
        await page.screenshot({ path: ssPath }).catch(() => {});
        failures.push({
          suite: 'functional',
          page: baseUrl,
          description: `Form ${el.selector} returned ${resp.status()} on empty submit`,
          screenshotPath: ssPath,
          raw: { selector: el.selector, status: resp.status() },
        });
      }
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
    } catch (err) {
      failures.push({
        suite: 'functional',
        page: baseUrl,
        description: `Form interaction error on ${el.selector}: ${(err as Error).message}`,
        raw: { selector: el.selector },
      });
    }
  }

  // Click safe buttons, capture errors
  for (const el of pageInfo.elements.filter((e) => e.type === 'button' && isSafeToClick(e))) {
    try {
      const btn = await page.$(el.selector);
      if (!btn || !(await btn.isVisible())) continue;
      const errors: string[] = [];
      const onPageError = (err: Error) => errors.push(err.message);
      page.on('pageerror', onPageError);
      await btn.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
      page.off('pageerror', onPageError);
      if (errors.length) {
        const ssPath = `${screenshotDir}/btn-${Date.now()}.png`;
        await page.screenshot({ path: ssPath }).catch(() => {});
        failures.push({
          suite: 'functional',
          page: baseUrl,
          description: `Click on ${el.label} (${el.selector}) caused JS error: ${errors[0]}`,
          screenshotPath: ssPath,
          raw: { selector: el.selector, errors },
        });
      }
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
    } catch {
      // ignore individual button failures
    }
  }

  return failures;
}
