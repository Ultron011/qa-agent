import { writeFile } from 'node:fs/promises';
const ORDER = ['critical', 'high', 'medium', 'low'];
function fmtDuration(ms) {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}
function fmtTimestamp(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}
function renderBug(b) {
    const lines = [
        `### ${b.title}`,
        `- **URL:** ${b.page}`,
        `- **Reproduction:** ${b.reproduction}`,
        `- **Expected:** ${b.expected}`,
        `- **Actual:** ${b.actual}`,
    ];
    if (b.suspectedFile)
        lines.push(`- **Suspected file:** \`${b.suspectedFile}\``);
    if (b.screenshotPath)
        lines.push(`- **Screenshot:** ${b.screenshotPath}`);
    return lines.join('\n');
}
export function renderReport(siteMap, list, when) {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const b of list.bugs)
        counts[b.severity]++;
    const summary = [
        `# QA Report — ${fmtTimestamp(when)}`,
        '',
        '## Summary',
        `- Pages tested: ${siteMap.pages.length}`,
        `- Bugs found: ${list.bugs.length}` +
            (list.bugs.length
                ? ` (${ORDER.filter((s) => counts[s] > 0).map((s) => `${counts[s]} ${s}`).join(', ')})`
                : ''),
        `- Duration: ${fmtDuration(list.totalDurationMs)}`,
        '',
    ];
    const sections = [];
    for (const sev of ORDER) {
        const matching = list.bugs.filter((b) => b.severity === sev);
        if (matching.length === 0)
            continue;
        sections.push(`## ${sev[0].toUpperCase()}${sev.slice(1)}`);
        sections.push('');
        sections.push(matching.map(renderBug).join('\n\n'));
        sections.push('');
    }
    return summary.concat(sections).join('\n');
}
export async function writeReport(path, content) {
    await writeFile(path, content, 'utf8');
}
export function reportFilename(when) {
    const pad = (n) => String(n).padStart(2, '0');
    return `qa-report-${when.getUTCFullYear()}-${pad(when.getUTCMonth() + 1)}-${pad(when.getUTCDate())}-${pad(when.getUTCHours())}-${pad(when.getUTCMinutes())}.md`;
}
