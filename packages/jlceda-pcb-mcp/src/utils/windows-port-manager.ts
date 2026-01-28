/**
 * Windows Port Manager
 *
 * Port detection and process management for Windows platform.
 * Uses netstat, tasklist, and taskkill commands.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { WindowsPortOccupancyInfo, ProcessKillResult } from '../types/windows-port-manager.js';

const execAsync = promisify(exec);

/**
 * Windows port manager - detects and clears port usage
 */
export class WindowsPortManager {
  /**
   * Check and clear port if occupied
   * @param port - Port number to check and clear
   * @returns true if port is available or was successfully cleared
   */
  async checkAndClearPort(port: number): Promise<boolean> {
    // Step 1: Detect port occupancy
    const info = await this.detectPortOccupancy(port);

    if (!info.isOccupied) {
      console.error(`[PortManager] Port ${port} is available`);
      return true;
    }

    // Step 2: Kill process
    if (!info.pid) {
      console.error(`[PortManager] Port ${port} is occupied but cannot determine PID`);
      return false;
    }

    console.error(
      `[PortManager] Terminating process ${info.processName} ` +
      `(PID: ${info.pid}) using port ${port}...`
    );

    const result = await this.killProcess(info.pid);

    if (!result.success) {
      console.error(
        `[PortManager] Failed to terminate process ${info.pid}: ${result.error}`
      );
      return false;
    }

    console.error(`[PortManager] Successfully terminated process ${info.pid}`);

    // Step 3: Verify port is released
    await this.sleep(500);
    const verifyInfo = await this.detectPortOccupancy(port);

    if (!verifyInfo.isOccupied) {
      console.error(`[PortManager] Port ${port} is now available`);
      return true;
    }

    console.error(`[PortManager] Port ${port} still occupied after termination`);
    return false;
  }

  /**
   * Detect port occupancy using netstat
   * @param port - Port number to check
   * @returns Port occupancy information
   */
  async detectPortOccupancy(port: number): Promise<WindowsPortOccupancyInfo> {
    try {
      // Use netstat to find port
      const netstatCmd = `netstat -ano | findstr :${port}`;
      const { stdout } = await execAsync(netstatCmd);

      if (!stdout.trim()) {
        return { port, isOccupied: false };
      }

      // Parse output to get PID
      const lines = stdout.trim().split('\n');
      const pid = this.parsePidFromNetstat(lines);

      if (!pid) {
        return { port, isOccupied: false };
      }

      // Get process name
      const processName = await this.getProcessName(pid);

      return {
        port,
        isOccupied: true,
        pid,
        processName,
      };
    } catch (error) {
      // netstat command failed, assume port is not occupied
      return { port, isOccupied: false };
    }
  }

  /**
   * Parse netstat output to get PID
   * Example output: TCP    0.0.0.0:8765    0.0.0.0:0    LISTENING    12345
   * @param lines - Netstat output lines
   * @returns PID or undefined
   */
  private parsePidFromNetstat(lines: string[]): number | undefined {
    const line = lines.find(l => l.includes('LISTENING'));
    if (!line) return undefined;

    const parts = line.trim().split(/\s+/);
    const pidStr = parts[parts.length - 1];

    if (!pidStr) return undefined;

    const pid = parseInt(pidStr);
    return isNaN(pid) ? undefined : pid;
  }

  /**
   * Get Windows process name using tasklist
   * @param pid - Process ID
   * @returns Process name
   */
  private async getProcessName(pid: number): Promise<string> {
    try {
      const cmd = `tasklist /FI "PID eq ${pid}" /FO CSV /NH`;
      const { stdout } = await execAsync(cmd);

      // Output format: "node.exe","12345","Console","1","150,000 K"
      const match = stdout.match(/"([^"]+)"/);
      return match?.[1] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Kill process using taskkill
   * @param pid - Process ID to kill
   * @returns Kill result
   */
  async killProcess(pid: number): Promise<ProcessKillResult> {
    try {
      // Force kill process
      const cmd = `taskkill /PID ${pid} /F`;
      await execAsync(cmd);

      // Wait for process to exit
      const exited = await this.waitForProcessExit(pid, 5000);

      if (!exited) {
        return {
          success: false,
          pid,
          error: `Process ${pid} did not exit within 5000ms`,
        };
      }

      return { success: true, pid };
    } catch (error: unknown) {
      return {
        success: false,
        pid,
        error: error instanceof Error ? error.message : 'Failed to kill process',
      };
    }
  }

  /**
   * Wait for process to exit using tasklist to verify
   * @param pid - Process ID to wait for
   * @param timeout - Timeout in milliseconds
   * @returns true if process exited
   */
  private async waitForProcessExit(
    pid: number,
    timeout: number
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const cmd = `tasklist /FI "PID eq ${pid}" /FO CSV /NH`;
        const { stdout } = await execAsync(cmd);

        // If output doesn't contain PID, process has exited
        if (!stdout.includes(pid.toString())) {
          return true;
        }
      } catch {
        // Command failure might mean process has exited
        return true;
      }

      await this.sleep(200);
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
