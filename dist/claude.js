import { execa } from 'execa';
export async function runClaude(prompt, opts = {}) {
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
export async function runClaudeJSON(prompt, opts = {}) {
    const fullPrompt = `${prompt}\n\nRespond with ONLY valid JSON, no markdown fences, no commentary.`;
    const raw = await runClaude(fullPrompt, opts);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    try {
        return JSON.parse(cleaned);
    }
    catch (err) {
        throw new Error(`Failed to parse Claude JSON response: ${err.message}\nRaw: ${raw}`);
    }
}
