import { describe, it, expect } from 'vitest';
import { promptYesNo } from '../src/cli.js';

describe('promptYesNo', () => {
  it('returns true for "y"', async () => {
    const fakeReader = async () => 'y';
    expect(await promptYesNo('Fix?', fakeReader)).toBe(true);
  });
  it('returns false for "n"', async () => {
    const fakeReader = async () => 'n';
    expect(await promptYesNo('Fix?', fakeReader)).toBe(false);
  });
  it('returns false for empty', async () => {
    const fakeReader = async () => '';
    expect(await promptYesNo('Fix?', fakeReader)).toBe(false);
  });
});
