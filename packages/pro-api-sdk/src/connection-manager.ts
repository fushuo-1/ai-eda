/**
 * 连接管理器
 *
 * 管理WebSocket连接生命周期
 */

import { WebSocketClient } from './websocket-client.js';

/**
 * 连接管理器类
 */
export class ConnectionManager {
	private client: WebSocketClient;

	constructor() {
		this.client = new WebSocketClient();

		// 设置连接成功回调
		this.client.setConnectionCallback(() => {
			this.log('连接成功', 'info');
			this.updateUIStatus(true);
		});

		// 设置断开连接监听器
		this.client.setDisconnectionCallback(() => {
			this.log('连接已断开', 'warn');
			this.updateUIStatus(false);
		});
	}

	/**
	 * 更新UI状态显示
	 */
	private updateUIStatus(connected: boolean): void {
		const status = connected ? '已连接' : '已断开';
		const messageType = connected ? ESYS_ToastMessageType.SUCCESS : ESYS_ToastMessageType.ERROR;

		// 显示Toast通知
		eda.sys_ToastMessage.showMessage(`连接状态：${status}`, messageType);

		// 更新全局状态（供其他组件查询）
		if (globalThis._jlcedaWebSocketBridge) {
			globalThis._jlcedaWebSocketBridge.connectionStatus = status;
		}

		this.log(`UI状态已更新: ${status}`);
	}

	/**
	 * 启动连接
	 */
	async start(): Promise<void> {
		this.log('正在启动连接管理器...');
		const success = await this.client.connect();
		if (!success) {
			this.log('连接失败', 'error');
		}
	}

	/**
	 * 停止连接
	 */
	stop(): void {
		this.log('正在停止连接管理器...');
		this.client.disconnect();
	}

	/**
	 * 检查是否已连接
	 */
	isConnected(): boolean {
		return this.client.isConnected;
	}

	/**
	 * 重新连接
	 * 先断开当前连接（如果已连接），然后重新建立连接
	 */
	async reconnect(): Promise<void> {
		this.log('正在重新连接...');

		// 如果当前已连接，先断开
		if (this.isConnected()) {
			this.log('断开当前连接');
			this.client.disconnect();
		}

		// 重新建立连接
		await this.start();
	}

	/**
	 * 日志输出
	 */
	private log(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
		const prefix = '[连接管理器]';
		switch (type) {
			case 'error':
				console.error(prefix, message);
				break;
			case 'warn':
				console.warn(prefix, message);
				break;
			default:
				console.log(prefix, message);
		}
	}
}
