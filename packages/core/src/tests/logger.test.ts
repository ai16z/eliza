import { elizaLogger } from '../logger';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ElizaLogger Error Handling', () => {
    beforeEach(() => {
        // Reset logger state
        elizaLogger.closeByNewLine = true;
        elizaLogger.useIcons = true;
    });

    it('should properly log string error messages', () => {
        elizaLogger.error('Simple error message');
    });

    it('should properly log Error objects', () => {
        const error = new Error('Test error message');
        elizaLogger.error('Error occurred:', error);
    });

    it('should properly log multiple arguments', () => {
        elizaLogger.error(
            'Failed to process request:',
            { id: 123, type: 'test' },
            'Additional context:',
            new Error('Network timeout')
        );
    });

    it('should handle empty error messages', () => {
        elizaLogger.error();
    });

    it('should properly log nested errors', () => {
        try {
            throw new Error('Inner error');
        } catch (innerError) {
            const outerError = new Error('Outer error');
            // @ts-ignore - for testing
            outerError.cause = innerError;
            elizaLogger.error('Complex error:', outerError);
        }
    });
}); 