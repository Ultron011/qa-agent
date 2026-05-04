import AxeBuilder from '@axe-core/playwright';
export function axeViolationsToFailures(violations, pageUrl) {
    return violations.map((v) => ({
        suite: 'accessibility',
        page: pageUrl,
        description: `[${v.id}] ${v.description} (impact: ${v.impact ?? 'unknown'}, ${v.nodes.length} node(s))`,
        raw: v,
    }));
}
export async function runAccessibilitySuite(page, pageUrl) {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    return axeViolationsToFailures(results.violations, pageUrl);
}
