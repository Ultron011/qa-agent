import { execa } from 'execa';
export function prTitle(when) {
    const pad = (n) => String(n).padStart(2, '0');
    return `fix: QA automated fixes — ${when.getUTCFullYear()}-${pad(when.getUTCMonth() + 1)}-${pad(when.getUTCDate())}`;
}
export function prBody(reportMarkdown, fixCount) {
    return [
        `Automated QA fixes — ${fixCount} fix(es) applied.`,
        '',
        '---',
        '',
        reportMarkdown,
    ].join('\n');
}
export async function ghAvailable(repoPath) {
    const r = await execa('gh', ['auth', 'status'], { cwd: repoPath, reject: false });
    return r.exitCode === 0;
}
export async function pushBranch(repoPath, branch) {
    await execa('git', ['push', '-u', 'origin', branch], { cwd: repoPath });
}
export async function createPR(repoPath, title, body, branch) {
    const r = await execa('gh', ['pr', 'create', '--title', title, '--body', body, '--head', branch], { cwd: repoPath });
    return r.stdout.trim();
}
