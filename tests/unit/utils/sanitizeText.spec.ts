import { describe, it, expect } from 'vitest';
import { stripControlChars } from 'utils/sanitizeText';

// starting test function to check test runner
describe ('stripControlChars', () => {
  it('should remove control characters from a string', () => {
    expect(stripControlChars('Hello\x00 World\x1F!')).toBe('Hello World!');
  });

  it('should return empty string for empty input', () => {
    expect(stripControlChars('')).toBe('');
  });

  it('should return same string if no control chars', () => {
    expect(stripControlChars('Clean text')).toBe('Clean text');
  });

  it('should handle string with only control chars', () => {
    expect(stripControlChars('\x00\x1F')).toBe('');
  });
});