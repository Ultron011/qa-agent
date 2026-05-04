import { describe, it, expect, vi } from 'vitest';
import { runClaude } from '../src/claude.js';

vi.mock('execa', () => ({
  execa: vi.fn(async () => ({ stdout: 'mocked claude response', stderr: '', exitCode: 0 })),
}));

describe('runClaude', () => {
  it('invokes claude -p with prompt and returns stdout', async () => {
    const result = await runClaude('hello');
    expect(result).toBe('mocked claude response');
  });

  it('throws if claude exits non-zero', async () => {
    const { execa } = await import('execa');
    (execa as unknown as { mockImplementationOnce: (fn: () => Promise<unknown>) => void }).mockImplementationOnce(
      async () => ({ stdout: '', stderr: 'boom', exitCode: 1 })
    );
    await expect(runClaude('x')).rejects.toThrow(/claude exited/);
  });
});
