import { runClaudeJSON } from './claude.js';
const ANALYZE_PROMPT = (raw, repoPath) => `
You are a senior QA engineer. Analyze the following test failures from an automated browser test run.

Repository path (for file references): ${repoPath}
Site root: ${raw.siteMap.rootUrl}
Pages crawled: ${raw.siteMap.pages.length}
Failures count: ${raw.failures.length}

Failure data (JSON):
${JSON.stringify(raw.failures, null, 2)}

For each distinct bug, output an entry with these exact fields:
- id: kebab-case slug
- severity: one of "critical" | "high" | "medium" | "low"
- page: URL where bug occurs
- title: short summary
- reproduction: exact steps
- expected: expected behavior
- actual: observed behavior
- suspectedFile: best-guess source file path relative to the repo (or omit if unknown)
- screenshotPath: copy from the failure raw if present (or omit)

De-duplicate similar failures into one bug. Output a JSON array (not wrapped in an object).
`.trim();
export async function analyzeFailures(raw, repoPath) {
    if (raw.failures.length === 0) {
        return { bugs: [], totalDurationMs: raw.durationMs };
    }
    const bugs = await runClaudeJSON(ANALYZE_PROMPT(raw, repoPath), { timeoutMs: 180_000 });
    return { bugs, totalDurationMs: raw.durationMs };
}
