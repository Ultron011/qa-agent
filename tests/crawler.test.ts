import { describe, it, expect } from 'vitest';
import { extractInteractiveElements, isSameOrigin } from '../src/crawler.js';

describe('isSameOrigin', () => {
  it('returns true for same origin', () => {
    expect(isSameOrigin('https://a.com/x', 'https://a.com/y')).toBe(true);
  });
  it('returns false for different origins', () => {
    expect(isSameOrigin('https://a.com', 'https://b.com')).toBe(false);
  });
});

describe('extractInteractiveElements', () => {
  it('is a function exported from crawler', () => {
    expect(typeof extractInteractiveElements).toBe('function');
  });
});
