/**
 * Windows Port Manager Types
 *
 * Type definitions for Windows port detection and process management.
 */

/**
 * Windows port occupancy information
 */
export interface WindowsPortOccupancyInfo {
  /** Port number */
  port: number;
  /** Whether the port is occupied */
  isOccupied: boolean;
  /** Process ID (if occupied) */
  pid?: number;
  /** Process name (if occupied) */
  processName?: string;
}

/**
 * Process kill result
 */
export interface ProcessKillResult {
  /** Whether the process was successfully terminated */
  success: boolean;
  /** Process ID */
  pid: number;
  /** Error message (if failed) */
  error?: string;
}
