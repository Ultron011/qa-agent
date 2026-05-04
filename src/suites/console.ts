import { Page } from 'playwright';
import type { TestFailure } from '../types.js';

export type ConsoleEvent =
  | { type: 'console'; level: string; text: string }
  | { type: 'network'; status: number; url: string }
  | { type: 'pageerror'; message: string };

export function classifyConsoleEvent(e: ConsoleEvent): 'failure' | 'ok' {
  if (e.type === 'network') return e.status >= 400 ? 'failure' : 'ok';
  if (e.type === 'console') return e.level === 'error' ? 'failure' : 'ok';
  if (e.type === 'pageerror') return 'failure';
  return 'ok';
}

export async function runConsoleSuite(page: Page, pageUrl: string): Promise<TestFailure[]> {
  const events: ConsoleEvent[] = [];
  const onConsole = (msg: import('playwright').ConsoleMessage) => {
    if (msg.type() === 'error') events.push({ type: 'console', level: 'error', text: msg.text() });
  };
  const onPageError = (err: Error) => {
    events.push({ type: 'pageerror', message: err.message });
  };
  const onResponse = (resp: import('playwright').Response) => {
    events.push({ type: 'network', status: resp.status(), url: resp.url() });
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('response', onResponse);

  // Allow time for late events
  await page.waitForTimeout(2000);

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  page.off('response', onResponse);

  return events
    .filter((e) => classifyConsoleEvent(e) === 'failure')
    .map((e) => ({
      suite: 'console' as const,
      page: pageUrl,
      description:
        e.type === 'console'
          ? `Console error: ${e.text}`
          : e.type === 'pageerror'
            ? `Uncaught: ${e.message}`
            : `Network ${e.status}: ${e.url}`,
      raw: e,
    }));
}
