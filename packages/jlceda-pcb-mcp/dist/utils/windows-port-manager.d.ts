/**
 * Windows Port Manager
 *
 * Port detection and process management for Windows platform.
 * Uses netstat, tasklist, and taskkill commands.
 */
import type { WindowsPortOccupancyInfo, ProcessKillResult } from '../types/windows-port-manager.js';
/**
 * Windows port manager - detects and clears port usage
 */
export declare class WindowsPortManager {
    /**
     * Check and clear port if occupied
     * @param port - Port number to check and clear
     * @returns true if port is available or was successfully cleared
     */
    checkAndClearPort(port: number): Promise<boolean>;
    /**
     * Detect port occupancy using netstat
     * @param port - Port number to check
     * @returns Port occupancy information
     */
    detectPortOccupancy(port: number): Promise<WindowsPortOccupancyInfo>;
    /**
     * Parse netstat output to get PID
     * Example output: TCP    0.0.0.0:8765    0.0.0.0:0    LISTENING    12345
     * @param lines - Netstat output lines
     * @returns PID or undefined
     */
    private parsePidFromNetstat;
    /**
     * Get Windows process name using tasklist
     * @param pid - Process ID
     * @returns Process name
     */
    private getProcessName;
    /**
     * Kill process using taskkill
     * @param pid - Process ID to kill
     * @returns Kill result
     */
    killProcess(pid: number): Promise<ProcessKillResult>;
    /**
     * Wait for process to exit using tasklist to verify
     * @param pid - Process ID to wait for
     * @param timeout - Timeout in milliseconds
     * @returns true if process exited
     */
    private waitForProcessExit;
    /**
     * Sleep for specified milliseconds
     * @param ms - Milliseconds to sleep
     * @returns Promise that resolves after sleep
     */
    private sleep;
}
//# sourceMappingURL=windows-port-manager.d.ts.map