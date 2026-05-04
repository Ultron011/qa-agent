import { describe, it, expect } from 'vitest';
import { isSafeToClick } from '../../src/suites/functional.js';
import type { InteractiveElement } from '../../src/types.js';

describe('isSafeToClick', () => {
  it('returns false for logout-like buttons', () => {
    const el: InteractiveElement = { selector: 'b', type: 'button', label: 'Log out', attributes: {} };
    expect(isSafeToClick(el)).toBe(false);
  });
  it('returns false for delete-like buttons', () => {
    const el: InteractiveElement = { selector: 'b', type: 'button', label: 'Delete account', attributes: {} };
    expect(isSafeToClick(el)).toBe(false);
  });
  it('returns true for benign buttons', () => {
    const el: InteractiveElement = { selector: 'b', type: 'button', label: 'Open menu', attributes: {} };
    expect(isSafeToClick(el)).toBe(true);
  });
});
