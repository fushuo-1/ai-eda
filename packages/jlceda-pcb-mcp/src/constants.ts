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
export enum ErrorCode {
  // Network errors (1xxx)
  CONNECTION_FAILED = 1001,
  REQUEST_TIMEOUT = 1002,
  EXTENSION_DISCONNECTED = 1003,

  // Parameter errors (2xxx)
  MISSING_REQUIRED_PARAM = 2001,
  INVALID_PARAM_VALUE = 2002,
  PARAM_OUT_OF_RANGE = 2003,

  // API errors (3xxx)
  API_CALL_FAILED = 3001,
  COMPONENT_NOT_FOUND = 3002,
  OPERATION_FAILED = 3003,

  // Business logic errors (4xxx)
  NO_DOCUMENT_OPEN = 4001,
  UNSUPPORTED_OPERATION = 4002,
}
