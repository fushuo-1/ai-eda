/**
 * Global constants for JLCEDA MCP Server
 */
// Request timeout (milliseconds)
export const DEFAULT_REQUEST_TIMEOUT = 120000; // 120 seconds
// Response character limit
export const DEFAULT_CHARACTER_LIMIT = 25000;
// WebSocket configuration
export const MAX_RECONNECT_ATTEMPTS = 10;
export const DEFAULT_RECONNECT_INTERVAL = 2000;
export const WEBSOCKET_PORT = 8765;
// Health check interval (milliseconds)
export const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
/**
 * Error code enumeration
 * Network errors: 1xxx
 * Parameter errors: 2xxx
 * API errors: 3xxx
 * Business logic errors: 4xxx
 */
export var ErrorCode;
(function (ErrorCode) {
    // Network errors (1xxx)
    ErrorCode[ErrorCode["CONNECTION_FAILED"] = 1001] = "CONNECTION_FAILED";
    ErrorCode[ErrorCode["REQUEST_TIMEOUT"] = 1002] = "REQUEST_TIMEOUT";
    ErrorCode[ErrorCode["EXTENSION_DISCONNECTED"] = 1003] = "EXTENSION_DISCONNECTED";
    // Parameter errors (2xxx)
    ErrorCode[ErrorCode["MISSING_REQUIRED_PARAM"] = 2001] = "MISSING_REQUIRED_PARAM";
    ErrorCode[ErrorCode["INVALID_PARAM_VALUE"] = 2002] = "INVALID_PARAM_VALUE";
    ErrorCode[ErrorCode["PARAM_OUT_OF_RANGE"] = 2003] = "PARAM_OUT_OF_RANGE";
    // API errors (3xxx)
    ErrorCode[ErrorCode["API_CALL_FAILED"] = 3001] = "API_CALL_FAILED";
    ErrorCode[ErrorCode["COMPONENT_NOT_FOUND"] = 3002] = "COMPONENT_NOT_FOUND";
    ErrorCode[ErrorCode["OPERATION_FAILED"] = 3003] = "OPERATION_FAILED";
    // Business logic errors (4xxx)
    ErrorCode[ErrorCode["NO_DOCUMENT_OPEN"] = 4001] = "NO_DOCUMENT_OPEN";
    ErrorCode[ErrorCode["UNSUPPORTED_OPERATION"] = 4002] = "UNSUPPORTED_OPERATION";
})(ErrorCode || (ErrorCode = {}));
//# sourceMappingURL=constants.js.map