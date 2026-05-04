import { chromium } from 'playwright';
export function isSameOrigin(a, b) {
    try {
        return new URL(a).origin === new URL(b).origin;
    }
    catch {
        return false;
    }
}
export async function extractInteractiveElements(page) {
    return await page.evaluate(() => {
        const results = [];
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const links = Array.from(document.querySelectorAll('a[href]'));
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        const forms = Array.from(document.querySelectorAll('form'));
        function attrs(el) {
            const out = {};
            for (const a of Array.from(el.attributes))
                out[a.name] = a.value;
            return out;
        }
        function selectorFor(el, idx, tag) {
            const id = el.getAttribute('id');
            if (id)
                return `#${id}`;
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
        return results;
    });
}
export async function crawl(opts) {
    const { rootUrl, maxDepth, maxPages = 50 } = opts;
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const visited = new Set();
    const pages = [];
    const queue = [{ url: rootUrl, depth: 0 }];
    try {
        while (queue.length > 0 && pages.length < maxPages) {
            const { url, depth } = queue.shift();
            if (visited.has(url) || depth > maxDepth)
                continue;
            visited.add(url);
            const page = await context.newPage();
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
                const title = await page.title();
                const elements = await extractInteractiveElements(page);
                pages.push({ url, title, elements });
                if (depth < maxDepth) {
                    const hrefs = await page.$$eval('a[href]', (links) => links.map((a) => a.href));
                    for (const href of hrefs) {
                        if (isSameOrigin(rootUrl, href) && !visited.has(href)) {
                            queue.push({ url: href, depth: depth + 1 });
                        }
                    }
                }
            }
            catch (err) {
                console.warn(`Crawl skip ${url}: ${err.message}`);
            }
            finally {
                await page.close();
            }
        }
    }
    finally {
        await browser.close();
    }
    return { rootUrl, pages };
}
