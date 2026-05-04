import { Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import type { TestFailure } from '../types.js';

interface AxeNode { target: string[]; html: string }
interface AxeViolation { id: string; impact: string | null; description: string; nodes: AxeNode[] }

export function axeViolationsToFailures(violations: AxeViolation[], pageUrl: string): TestFailure[] {
  return violations.map((v) => ({
    suite: 'accessibility' as const,
    page: pageUrl,
    description: `[${v.id}] ${v.description} (impact: ${v.impact ?? 'unknown'}, ${v.nodes.length} node(s))`,
    raw: v,
  }));
}

export async function runAccessibilitySuite(page: Page, pageUrl: string): Promise<TestFailure[]> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  return axeViolationsToFailures(results.violations as AxeViolation[], pageUrl);
}
