// tests/e2e/smoke.test.ts
import { describe, it, expect } from 'vitest';
import { crawl } from '../../src/crawler.js';

describe('e2e smoke', () => {
  it('crawls example.com without throwing', async () => {
    const map = await crawl({ rootUrl: 'https://example.com', maxDepth: 0 });
    expect(map.pages.length).toBeGreaterThanOrEqual(1);
    expect(map.pages[0].title).toBeTruthy();
  }, 60_000);
});
