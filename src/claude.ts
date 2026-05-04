import { execa } from 'execa';

export interface ClaudeOptions {
  timeoutMs?: number;
  cwd?: string;
}

export async function runClaude(prompt: string, opts: ClaudeOptions = {}): Promise<string> {
  const { timeoutMs = 120_000, cwd } = opts;
  const result = await execa('claude', ['-p', prompt], {
    cwd,
    timeout: timeoutMs,
    reject: false,
  });
  if (result.exitCode !== 0) {
    throw new Error(`claude exited with code ${result.exitCode}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

export async function runClaudeJSON<T>(prompt: string, opts: ClaudeOptions = {}): Promise<T> {
  const fullPrompt = `${prompt}\n\nRespond with ONLY valid JSON, no markdown fences, no commentary.`;
  const raw = await runClaude(fullPrompt, opts);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON response: ${(err as Error).message}\nRaw: ${raw}`);
  }
}
