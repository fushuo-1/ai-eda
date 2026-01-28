/**
 * Centralized error handling for MCP server
 */
import { ErrorCode } from '../constants.js';
/**
 * Custom MCP error class with error codes and suggestions
 */
export class MCPError extends Error {
    code;
    suggestion;
    constructor(code, message, suggestion) {
        super(message);
        this.code = code;
        this.suggestion = suggestion;
        this.name = 'MCPError';
    }
    /**
     * Convert error to MCP response format
     */
    toResponse() {
        let text = `Error [${this.code}]: ${this.message}`;
        if (this.suggestion) {
            text += `\n\n💡 Suggestion: ${this.suggestion}`;
        }
        return {
            content: [{ type: 'text', text }],
            isError: true,
        };
    }
}
/**
 * Handle API errors and convert to MCPError
 */
export function handleApiError(error) {
    if (error instanceof MCPError) {
        return error;
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Categorize errors by message content
        if (message.includes('timeout')) {
            return new MCPError(ErrorCode.REQUEST_TIMEOUT, 'Request timed out', 'The extension may be busy or unresponsive. Please try again.');
        }
        if (message.includes('disconnect') || message.includes('connection')) {
            return new MCPError(ErrorCode.EXTENSION_DISCONNECTED, 'Extension connection lost', 'Please ensure:\n1. JLCEDA Pro is running\n2. The WebSocket bridge extension is loaded\n3. A document is open');
        }
        if (message.includes('not found')) {
            return new MCPError(ErrorCode.COMPONENT_NOT_FOUND, 'Resource not found', 'Please verify the component designator or ID is correct');
        }
    }
    // Default error
    return new MCPError(ErrorCode.API_CALL_FAILED, error instanceof Error ? error.message : 'Unknown error', 'Check the console logs for more details');
}
/**
 * Create error response for missing extension connection
 */
export function createExtensionDisconnectedError() {
    return new MCPError(ErrorCode.EXTENSION_DISCONNECTED, 'No JLCEDA extension connected', 'Please ensure:\n1. JLCEDA Pro is running\n2. The WebSocket bridge extension is imported\n3. A document is open').toResponse();
}
//# sourceMappingURL=error-handler.js.map