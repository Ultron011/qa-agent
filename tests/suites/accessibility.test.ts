import { describe, it, expect } from 'vitest';
import { axeViolationsToFailures } from '../../src/suites/accessibility.js';

describe('axeViolationsToFailures', () => {
  it('maps axe violations to TestFailure shape', () => {
    const violations = [
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        nodes: [{ target: ['button.x'], html: '<button>x</button>' }],
      },
    ];
    const out = axeViolationsToFailures(violations as never, 'https://x/y');
    expect(out).toHaveLength(1);
    expect(out[0].suite).toBe('accessibility');
    expect(out[0].page).toBe('https://x/y');
    expect(out[0].description).toContain('color-contrast');
  });
});
