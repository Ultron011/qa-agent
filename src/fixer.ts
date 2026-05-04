import { execa } from 'execa';
import { readFile, writeFile } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { runClaudeJSON } from './claude.js';
import type { Bug, BugList } from './types.js';

export function fixBranchName(when: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `qa-fix/${when.getUTCFullYear()}-${pad(when.getUTCMonth() + 1)}-${pad(when.getUTCDate())}`;
}

export function commitMessageFor(bug: Bug): string {
  return `fix: ${bug.title}`;
}

interface FileEdit { path: string; newContent: string }

const FIX_PROMPT = (bug: Bug, fileContent: string, filePath: string) => `
You are fixing a bug in a code file.

Bug:
- Title: ${bug.title}
- Page: ${bug.page}
- Reproduction: ${bug.reproduction}
- Expected: ${bug.expected}
- Actual: ${bug.actual}

Target file: ${filePath}

Current file content:
\`\`\`
${fileContent}
\`\`\`

Return JSON: { "newContent": "<full updated file content>" }
Apply the minimal change to fix the bug. Preserve all other code exactly.
`.trim();

export interface FixResult { bug: Bug; applied: boolean; reason?: string; filePath?: string }

async function gitInRepo(repoPath: string, args: string[]): Promise<void> {
  await execa('git', args, { cwd: repoPath });
}

async function ensureBranch(repoPath: string, branch: string): Promise<void> {
  const result = await execa('git', ['rev-parse', '--verify', branch], { cwd: repoPath, reject: false });
  if (result.exitCode === 0) {
    await gitInRepo(repoPath, ['checkout', branch]);
  } else {
    await gitInRepo(repoPath, ['checkout', '-b', branch]);
  }
}

export async function applyFix(repoPath: string, bug: Bug): Promise<FixResult> {
  if (!bug.suspectedFile) return { bug, applied: false, reason: 'no suspected file' };
  const absPath = isAbsolute(bug.suspectedFile) ? bug.suspectedFile : join(repoPath, bug.suspectedFile);
  let content: string;
  try {
    content = await readFile(absPath, 'utf8');
  } catch {
    return { bug, applied: false, reason: `cannot read ${bug.suspectedFile}` };
  }
  const edit = await runClaudeJSON<FileEdit>(FIX_PROMPT(bug, content, bug.suspectedFile), { timeoutMs: 180_000 });
  if (!edit.newContent || edit.newContent === content) {
    return { bug, applied: false, reason: 'no change produced' };
  }
  await writeFile(absPath, edit.newContent, 'utf8');
  return { bug, applied: true, filePath: bug.suspectedFile };
}

export async function applyAllFixes(repoPath: string, list: BugList, when: Date): Promise<FixResult[]> {
  const branch = fixBranchName(when);
  await ensureBranch(repoPath, branch);
  const ordered: Bug[] = [...list.bugs].sort((a, b) => {
    const order = ['critical', 'high', 'medium', 'low'];
    return order.indexOf(a.severity) - order.indexOf(b.severity);
  });
  const results: FixResult[] = [];
  for (const bug of ordered) {
    const result = await applyFix(repoPath, bug);
    results.push(result);
    if (result.applied && result.filePath) {
      await gitInRepo(repoPath, ['add', result.filePath]);
      await gitInRepo(repoPath, ['commit', '-m', commitMessageFor(bug)]);
    }
  }
  return results;
}
