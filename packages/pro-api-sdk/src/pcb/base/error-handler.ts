/**
 * PCB API 错误处理工具
 *
 * 提供统一的错误处理包装函数
 */

/**
 * 标准响应格式
 */
export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * 错误处理包装函数
 *
 * @param operation 要执行的异步操作
 * @param context 操作上下文（用于日志）
 * @returns 标准响应格式
 */
export async function withErrorHandling<T>(
	operation: () => Promise<T>,
	context: string
): Promise<ApiResponse<T>> {
	try {
		const data = await operation();
		return { success: true, data };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`[PCB API] ${context} error:`, error);
		return { success: false, error: errorMessage };
	}
}

/**
 * 构建成功响应
 */
export function successResponse<T>(data: T): ApiResponse<T> {
	return { success: true, data };
}

/**
 * 构建错误响应
 */
export function errorResponse(error: string): ApiResponse {
	return { success: false, error };
}
