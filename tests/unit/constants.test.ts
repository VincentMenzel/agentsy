import { describe, it, expect } from 'vitest';
import { DEFAULT_AGENT_FOLDERS } from '../../src/constants.js';

describe('Constants', () => {
  it('should export DEFAULT_AGENT_FOLDERS', () => {
    expect(DEFAULT_AGENT_FOLDERS).toBeDefined();
    expect(Array.isArray(DEFAULT_AGENT_FOLDERS)).toBe(true);
    expect(DEFAULT_AGENT_FOLDERS).toContain('.gemini');
  });
});
