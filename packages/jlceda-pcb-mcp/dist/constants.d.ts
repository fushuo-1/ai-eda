/**
 * Global constants for JLCEDA MCP Server
 */
export declare const DEFAULT_REQUEST_TIMEOUT = 120000;
export declare const DEFAULT_CHARACTER_LIMIT = 25000;
export declare const MAX_RECONNECT_ATTEMPTS = 10;
export declare const DEFAULT_RECONNECT_INTERVAL = 2000;
export declare const WEBSOCKET_PORT = 8765;
export declare const HEALTH_CHECK_INTERVAL = 30000;
/**
 * Error code enumeration
 * Network errors: 1xxx
 * Parameter errors: 2xxx
 * API errors: 3xxx
 * Business logic errors: 4xxx
 */
export declare enum ErrorCode {
    CONNECTION_FAILED = 1001,
    REQUEST_TIMEOUT = 1002,
    EXTENSION_DISCONNECTED = 1003,
    MISSING_REQUIRED_PARAM = 2001,
    INVALID_PARAM_VALUE = 2002,
    PARAM_OUT_OF_RANGE = 2003,
    API_CALL_FAILED = 3001,
    COMPONENT_NOT_FOUND = 3002,
    OPERATION_FAILED = 3003,
    NO_DOCUMENT_OPEN = 4001,
    UNSUPPORTED_OPERATION = 4002
}
//# sourceMappingURL=constants.d.ts.map