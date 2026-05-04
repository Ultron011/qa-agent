import { describe, it, expect } from 'vitest';
import { classifyConsoleEvent } from '../../src/suites/console.js';

describe('classifyConsoleEvent', () => {
  it('flags 4xx network as failure', () => {
    expect(classifyConsoleEvent({ type: 'network', status: 404, url: 'x' })).toBe('failure');
  });
  it('flags 5xx network as failure', () => {
    expect(classifyConsoleEvent({ type: 'network', status: 503, url: 'x' })).toBe('failure');
  });
  it('flags 2xx network as ok', () => {
    expect(classifyConsoleEvent({ type: 'network', status: 200, url: 'x' })).toBe('ok');
  });
  it('flags console error as failure', () => {
    expect(classifyConsoleEvent({ type: 'console', level: 'error', text: 'boom' })).toBe('failure');
  });
});
