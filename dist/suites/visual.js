export function findVisualIssues(report, pageUrl) {
    const failures = [];
    for (const url of report.brokenImages) {
        failures.push({ suite: 'visual', page: pageUrl, description: `Broken image: ${url}`, raw: { url } });
    }
    for (const sel of report.overflowingElements) {
        failures.push({ suite: 'visual', page: pageUrl, description: `Element overflow viewport: ${sel}`, raw: { sel } });
    }
    return failures;
}
export async function runVisualSuite(page, pageUrl) {
    const report = await page.evaluate(() => {
        const broken = [];
        const overflow = [];
        document.querySelectorAll('img').forEach((img) => {
            if (!img.complete || img.naturalWidth === 0)
                broken.push(img.src);
        });
        const vw = window.innerWidth;
        document.querySelectorAll('body *').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > vw + 5) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className?.toString().split(' ').filter(Boolean).slice(0, 1).join('.');
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
