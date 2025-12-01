import { describe, it, expect } from 'vitest';
import { stripControlChars } from 'utils/sanitizeText';

// starting test function to check test runner
describe ('stripControlChars', () => {
    it('test', () => {
        expect(1).toBe(1);
    });
    it('should remove control characters from a string', () => {
        const input = 'Hello\x00 World\x1F!';
        const expectedOutput = 'Hello World!';
        expect(stripControlChars(input)).toBe(expectedOutput);
    });
});