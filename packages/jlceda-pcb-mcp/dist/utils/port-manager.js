/**
 * 端口管理工具 - Windows 平台
 *
 * 功能：
 * - 检查端口是否被占用
 * - 终止占用端口的进程
 * - 确保端口可用
 */
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
/**
 * 检查端口是否被占用
 * @param port - 端口号
 * @returns 占用端口的进程 PID，如果未被占用返回 null
 */
export async function checkPortInUse(port) {
    const command = `netstat -ano | findstr :${port}`;
    try {
        const { stdout } = await execAsync(command);
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            // 解析第一行的 PID（最后一列）
            const parts = lines[0].trim().split(/\s+/);
            const pid = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(pid)) {
                return pid;
            }
        }
        return null;
    }
    catch (error) {
        // netstat 返回空（findstr 找不到匹配）表示端口未被占用
        return null;
    }
}
/**
 * 终止指定进程
 * @param pid - 进程 ID
 * @returns 是否成功终止
 */
export async function killProcess(pid) {
    try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.error(`[Port Manager] Process ${pid} terminated`);
        return true;
    }
    catch (error) {
        console.error(`[Port Manager] Failed to kill process ${pid}:`, error.message);
        return false;
    }
}
/**
 * 确保端口可用
 * - 检查端口是否被占用
 * - 如果被占用，终止占用进程
 * - 等待 500ms 确保端口释放
 * - 二次确认端口状态
 *
 * @param port - 端口号
 * @throws 如果端口无法释放，抛出错误
 */
export async function ensurePortAvailable(port) {
    console.error(`[Port Manager] Checking port ${port}...`);
    const pid = await checkPortInUse(port);
    if (pid) {
        console.error(`[Port Manager] Port ${port} is occupied by process ${pid}`);
        console.error(`[Port Manager] Attempting to terminate process ${pid}...`);
        const killed = await killProcess(pid);
        if (!killed) {
            throw new Error(`Failed to release port ${port}. Please terminate process ${pid} manually.`);
        }
        // 等待端口释放
        await new Promise(resolve => setTimeout(resolve, 500));
        // 再次确认
        const stillOccupied = await checkPortInUse(port);
        if (stillOccupied) {
            throw new Error(`Port ${port} still occupied after termination attempt.`);
        }
        console.error(`[Port Manager] Port ${port} is now available`);
    }
    else {
        console.error(`[Port Manager] Port ${port} is available`);
    }
}
//# sourceMappingURL=port-manager.js.map