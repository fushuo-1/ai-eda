/**
 * Centralized error handling for MCP server
 */
import { ErrorCode } from '../constants.js';
/**
 * Custom MCP error class with error codes and suggestions
 */
export declare class MCPError extends Error {
    code: ErrorCode;
    suggestion?: string | undefined;
    constructor(code: ErrorCode, message: string, suggestion?: string | undefined);
    /**
     * Convert error to MCP response format
     */
    toResponse(): {
        content: {
            type: "text";
            text: string;
        }[];
        isError: boolean;
    };
}
/**
 * Handle API errors and convert to MCPError
 */
export declare function handleApiError(error: unknown): MCPError;
/**
 * Create error response for missing extension connection
 */
export declare function createExtensionDisconnectedError(): {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
};
//# sourceMappingURL=error-handler.d.ts.map