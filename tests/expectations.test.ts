import { describe, it, expect } from 'vitest';
import { parseExpectations } from '../src/expectations.js';

describe('parseExpectations', () => {
  it('parses categories and bullets', () => {
    const md = `## Login Flow
- User can log in with valid credentials
- Invalid password shows error message

## Dashboard
- Chart loads within 3 seconds
`;
    const out = parseExpectations(md);
    expect(out).toEqual([
      { category: 'Login Flow', description: 'User can log in with valid credentials' },
      { category: 'Login Flow', description: 'Invalid password shows error message' },
      { category: 'Dashboard', description: 'Chart loads within 3 seconds' },
    ]);
  });

  it('returns empty for empty input', () => {
    expect(parseExpectations('')).toEqual([]);
  });
});
