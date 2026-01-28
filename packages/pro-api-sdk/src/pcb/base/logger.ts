/**
 * PCB API 日志工具
 *
 * 提供统一的日志格式和输出
 */

/**
 * PCB 日志类
 */
export class PCBLogger {
	private prefix: string;

	constructor(module: string) {
		this.prefix = `[PCB API - ${module}]`;
	}

	/**
	 * 输出信息日志
	 */
	log(message: string, ...args: any[]): void {
		console.log(this.prefix, message, ...args);
	}

	/**
	 * 输出错误日志
	 */
	error(message: string, error: any): void {
		console.error(this.prefix, message, error);
	}

	/**
	 * 输出警告日志
	 */
	warn(message: string, ...args: any[]): void {
		console.warn(this.prefix, message, ...args);
	}
}
