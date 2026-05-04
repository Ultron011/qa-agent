import { chromium, Browser, Page } from 'playwright';
import type { SiteMap, PageInfo, InteractiveElement } from './types.js';

export function isSameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

export async function extractInteractiveElements(page: Page): Promise<InteractiveElement[]> {
  return await page.evaluate(() => {
    const results: Array<{ selector: string; type: string; label?: string; attributes: Record<string, string> }> = [];
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const links = Array.from(document.querySelectorAll('a[href]'));
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const forms = Array.from(document.querySelectorAll('form'));

    function attrs(el: Element): Record<string, string> {
      const out: Record<string, string> = {};
      for (const a of Array.from(el.attributes)) out[a.name] = a.value;
      return out;
    }
    function selectorFor(el: Element, idx: number, tag: string): string {
      const id = el.getAttribute('id');
      if (id) return `#${id}`;
      return `${tag}:nth-of-type(${idx + 1})`;
    }

    buttons.forEach((el, i) => results.push({
      selector: selectorFor(el, i, 'button'),
      type: 'button',
      label: el.textContent?.trim() ?? '',
      attributes: attrs(el),
    }));
    links.forEach((el, i) => results.push({
      selector: selectorFor(el, i, 'a'),
      type: 'link',
      label: el.textContent?.trim() ?? '',
      attributes: attrs(el),
    }));
    inputs.forEach((el, i) => results.push({
      selector: selectorFor(el, i, el.tagName.toLowerCase()),
      type: 'input',
      label: el.getAttribute('name') ?? el.getAttribute('placeholder') ?? '',
      attributes: attrs(el),
    }));
    forms.forEach((el, i) => results.push({
      selector: selectorFor(el, i, 'form'),
      type: 'form',
      attributes: attrs(el),
    }));
    return results as InteractiveElement[];
  });
}

export interface CrawlOptions {
  rootUrl: string;
  maxDepth: number;
  maxPages?: number;
}

export async function crawl(opts: CrawlOptions): Promise<SiteMap> {
  const { rootUrl, maxDepth, maxPages = 50 } = opts;
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const visited = new Set<string>();
  const pages: PageInfo[] = [];
  const queue: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 0 }];

  try {
    while (queue.length > 0 && pages.length < maxPages) {
      const { url, depth } = queue.shift()!;
      if (visited.has(url) || depth > maxDepth) continue;
      visited.add(url);

      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        const title = await page.title();
        const elements = await extractInteractiveElements(page);
        pages.push({ url, title, elements });

        if (depth < maxDepth) {
          const hrefs = await page.$$eval('a[href]', (links) =>
            links.map((a) => (a as HTMLAnchorElement).href)
          );
          for (const href of hrefs) {
            if (isSameOrigin(rootUrl, href) && !visited.has(href)) {
              queue.push({ url: href, depth: depth + 1 });
            }
          }
        }
      } catch (err) {
        console.warn(`Crawl skip ${url}: ${(err as Error).message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return { rootUrl, pages };
}
