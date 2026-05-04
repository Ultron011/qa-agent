import { execa } from 'execa';
export async function runClaude(prompt, opts = {}) {
    const { timeoutMs = 120_000, cwd } = opts;
    const result = await execa('claude', ['-p'], {
        cwd,
        timeout: timeoutMs,
        reject: false,
        input: prompt,
        shell: false,
    });
    if (result.exitCode !== 0) {
        const stderr = result.stderr || '(no stderr)';
        throw new Error(`claude exited with code ${result.exitCode ?? 'unknown'}: ${stderr}`);
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
