/**
 * 端口管理工具 - Windows 平台
 *
 * 功能：
 * - 检查端口是否被占用
 * - 终止占用端口的进程
 * - 确保端口可用
 */
/**
 * 检查端口是否被占用
 * @param port - 端口号
 * @returns 占用端口的进程 PID，如果未被占用返回 null
 */
export declare function checkPortInUse(port: number): Promise<number | null>;
/**
 * 终止指定进程
 * @param pid - 进程 ID
 * @returns 是否成功终止
 */
export declare function killProcess(pid: number): Promise<boolean>;
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
export declare function ensurePortAvailable(port: number): Promise<void>;
//# sourceMappingURL=port-manager.d.ts.map