/**
 * WebSocket 客户端
 *
 * 使用嘉立创EDA官方 SYS_WebSocket API 连接到本地服务器
 */

import type {
	PingParams,
	PongResult,
	ExtensionStatusResult,
	LogMessageParams,
	ShowMessageParams,
	WebSocketRequest,
	WebSocketResponse,
	WebSocketError,
	SCHGetAllComponentsParams,
	SCHGetComponentByDesignatorParams,
	SCHGetComponentPinsParams,
	SCHGetNetlistParams,
	SCHGetBomParams,
} from './protocol.js';
import { PCBApiAdapter } from './pcb-api-adapter.js';
import { SCHApiAdapter } from './sch-api-adapter.js';

/**
 * WebSocket 客户端类
 */
export class WebSocketClient {
	private connectionId = 'jlceda-local-server';
	private serverUrl = 'ws://localhost:8765';
	isConnected = false;
	private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
	private onMessageCallback?: (method: string, params: unknown) => void;
	private onConnectedCallback?: () => void;
	private onDisconnectedCallback?: () => void;
	private pcbAdapter = new PCBApiAdapter();
	private schAdapter = new SCHApiAdapter();

	// 心跳相关
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private heartbeatMissedCount = 0;
	private lastPongTime = 0;
	private lastPingTime = 0; // 记录最后一次发送ping的时间
	private readonly HEARTBEAT_INTERVAL = 15000; // 30秒
	private readonly PONG_TIMEOUT = 5000; // 5秒
	private readonly HEARTBEAT_MISSED_THRESHOLD = 3; // 连续超时次数

	// 重连相关
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectAttempts = 0;
	private readonly MAX_RECONNECT_ATTEMPTS = 3;
	private isManualDisconnect = false; // 区分手动/自动断开

	/**
	 * 连接到本地服务器
	 */
	connect(): Promise<boolean> {
		return new Promise((resolve) => {
			this.log('正在连接本地服务器: ' + this.serverUrl);

			// 设置5秒超时定时器
			const timeoutId = setTimeout(() => {
				this.log('连接超时（5秒）', 'error');
				console.log('[WebSocket Bridge] 连接失败：超时');
				eda.sys_ToastMessage.showMessage('连接失败', ESYS_ToastMessageType.ERROR);
				this.connectionTimeoutTimer = null;
				resolve(false);
			}, 5000);

			// 保存超时定时器ID
			this.connectionTimeoutTimer = timeoutId;

			// 使用全局 eda 对象的 sys_WebSocket 属性
			try {
				eda.sys_WebSocket.register(
					this.connectionId,
					this.serverUrl,
					(event: MessageEvent) => this.handleMessage(event.data),
					() => {
						// 连接成功回调
						clearTimeout(timeoutId);
						this.connectionTimeoutTimer = null;
						this.onConnected();

						this.log('连接成功');
						console.log('[WebSocket Bridge] 连接成功');
						eda.sys_ToastMessage.showMessage('连接成功', ESYS_ToastMessageType.SUCCESS);
						resolve(true);
					},
					[]
				);
			} catch (error) {
				clearTimeout(timeoutId);
				this.connectionTimeoutTimer = null;
				this.log('连接失败: ' + error, 'error');
				console.error('[WebSocket Bridge] 连接失败:', error);
				eda.sys_ToastMessage.showMessage('连接失败', ESYS_ToastMessageType.ERROR);
				resolve(false);
			}
		});
	}

	/**
	 * 断开连接
	 */
	disconnect(): void {
		// 标记为手动断开，阻止自动重连
		this.isManualDisconnect = true;

		// 清除超时定时器
		if (this.connectionTimeoutTimer !== null) {
			clearTimeout(this.connectionTimeoutTimer);
			this.connectionTimeoutTimer = null;
		}

		// 清除重连定时器
		if (this.reconnectTimer !== null) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		// 停止心跳检测
		this.stopHeartbeat();

		if (this.isConnected) {
			// 简化实现，直接断开连接
			eda.sys_WebSocket.close(this.connectionId, 1000, '用户断开连接');
			this.isConnected = false;
			this.log('已从本地服务器断开');
		}

		// 重置重连计数
		this.reconnectAttempts = 0;
	}

	/**
	 * 发送响应到服务器
	 */
	send(id: string, result: unknown): void {
		try {
			const response: WebSocketResponse = { id, result };
			eda.sys_WebSocket.send(this.connectionId, JSON.stringify(response));
		} catch (error) {
			this.log(`发送消息失败: ${error}，连接可能已断开`, 'warn');
			// 如果发送失败，说明连接已断开，触发重连
			if (this.isConnected && !this.isManualDisconnect) {
				this.isConnected = false;
				this.handleConnectionLost();
			}
		}
	}

	/**
	 * 发送错误响应
	 */
	sendError(id: string, code: number, message: string): void {
		const error: WebSocketError = { code, message };
		const response: WebSocketResponse = { id, error };
		eda.sys_WebSocket.send(this.connectionId, JSON.stringify(response));
	}

	/**
	 * 处理服务器消息
	 */
	private handleMessage(data: string): void {
		try {
			const message = JSON.parse(data);

			// 判断消息类型：检查是否有 method 字段
			if ('method' in message) {
				// 这是请求消息
				const request = message as WebSocketRequest;
				const { id, method, params } = request;

				this.log(`收到请求: ${method}`);

				//触发消息回调
				if (this.onMessageCallback) {
					this.onMessageCallback(method, params);
				}

				// SCH 操作路由
				if (method.startsWith('sch.')) {
					this.handleSCHRequest(id, method, params);
					return;
				}

				// 检查是否是 PCB 操作
				if (method.startsWith('pcb.')) {
					this.handlePCBRequest(id, method, params);
					return;
				}

				//路由到不同的处理器
				switch (method) {
					case 'ping':
						this.handlePing(id, params as unknown as PingParams);
						break;
					case 'pong':
						this.handlePong(params as unknown as PingParams);
						break;
					case 'get_status':
						this.handleGetStatus(id);
						break;
					case 'show_message':
						this.handleShowMessage(id, params as unknown as ShowMessageParams);
						break;
					case 'log_message':
						this.handleLogMessage(id, params as unknown as LogMessageParams);
						break;
					default:
						this.sendError(id, -1, `未知方法: ${method}`);
				}
			} else if ('result' in message || 'error' in message) {
				// 这是响应消息（服务器对客户端请求的响应）
				// 心跳pong响应会进入这里
				const response = message as WebSocketResponse;
				const { id, result } = response;

				// 检查是否是心跳pong响应
				if (id === 'heartbeat_ping' && result && typeof result === 'object') {
					const pongResult = result as Record<string, unknown>;
					if (pongResult.status === 'ok') {
						this.handlePong({ timestamp: pongResult.timestamp as number });
					}
				}

				this.log('收到响应消息');
			} else {
				this.sendError('', -1, '未知消息格式');
			}
		} catch (error) {
			this.log('处理消息时出错: ' + error, 'error');
			this.sendError('', -1, '处理消息时出错');
		}
	}

	/**
	 * 处理心跳请求
	 */
	private handlePing(id: string, params: PingParams): void {
		const result: PongResult = {
			status: 'ok',
			timestamp: params.timestamp,
			serverTime: Date.now(),
		};
		this.send(id, result);
	}

	/**
	 * 处理心跳响应
	 */
	private handlePong(params: PingParams): void {
		this.lastPongTime = Date.now();
		this.heartbeatMissedCount = 0; // 重置超时计数
		this.lastPingTime = 0; // 重置ping时间，因为连接正常
		this.log('收到心跳响应');
	}

	/**
	 * 启动心跳检测
	 */
	private startHeartbeat(): void {
		// 清除旧的心跳
		this.stopHeartbeat();

		this.log('启动心跳检测');
		this.heartbeatTimer = setInterval(() => {
			if (!this.isConnected) {
				this.stopHeartbeat();
				return;
			}

			const now = Date.now();

			// 发送心跳ping（使用请求格式）
			try {
				const pingParams: PingParams = { timestamp: now };
				const pingRequest: WebSocketRequest = {
					id: 'heartbeat_ping',
					method: 'ping',
					params: pingParams as unknown as Record<string, unknown>
				};
				eda.sys_WebSocket.send(this.connectionId, JSON.stringify(pingRequest));
				this.lastPingTime = now; // 记录发送时间
				this.log('发送心跳ping');
			} catch (error) {
				this.log(`发送心跳失败: ${error}`, 'warn');
				// 如果发送失败，说明连接已断开，触发重连
				if (this.isConnected && !this.isManualDisconnect) {
					this.isConnected = false;
					this.handleConnectionLost();
				}
			}

			// 检查上一次pong是否超时（5秒）
			// 修复：移除 lastPongTime > 0 的限制
			// 如果从未收到过pong（初始连接后立即断开），使用发送时间作为基准
			const timeSinceLastPong = this.lastPongTime > 0
				? now - this.lastPongTime
				: now - (this.lastPingTime || now - 10000); // 如果没有lastPingTime，假设10秒前

			if (timeSinceLastPong > this.PONG_TIMEOUT) {
				this.heartbeatMissedCount++;
				this.log(`心跳超时 (${this.heartbeatMissedCount}/${this.HEARTBEAT_MISSED_THRESHOLD})`, 'warn');

				if (this.heartbeatMissedCount >= this.HEARTBEAT_MISSED_THRESHOLD) {
					this.log('连接已丢失，触发重连', 'error');
					this.handleConnectionLost();
				}
			}
		}, this.HEARTBEAT_INTERVAL);
	}

	/**
	 * 停止心跳检测
	 */
	private stopHeartbeat(): void {
		if (this.heartbeatTimer !== null) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
			this.log('停止心跳检测');
		}
		this.heartbeatMissedCount = 0;
		this.lastPongTime = 0;
	}

	/**
	 * 处理连接丢失
	 */
	private async handleConnectionLost(): Promise<void> {
		this.stopHeartbeat();
		this.isConnected = false;

		// 如果是手动断开，不触发自动重连
		if (this.isManualDisconnect) {
			this.log('用户手动断开，不触发自动重连');
			return;
		}

		// 触发自动重连
		await this.attemptReconnect();
	}

	/**
	 * 尝试重连（指数退避算法）
	 */
	private async attemptReconnect(): Promise<void> {
		if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
			this.log('重连失败次数过多，已放弃', 'error');
			this.notifyReconnectFailed();
			return;
		}

		// 指数退避延迟：第1次1秒，第2次2秒，第3次4秒
		const delay = Math.pow(2, this.reconnectAttempts) * 1000;
		this.log(`第 ${this.reconnectAttempts + 1} 次重连，等待 ${delay / 1000} 秒...`);

		await new Promise<void>((resolve) => {
			this.reconnectTimer = setTimeout(resolve, delay);
		});

		this.reconnectAttempts++;
		const success = await this.connect();

		if (success) {
			this.log('重连成功', 'success');
			this.reconnectAttempts = 0; // 重置计数
		} else {
			this.log(`第 ${this.reconnectAttempts} 次重连失败`, 'error');
			await this.attemptReconnect(); // 继续重试
		}
	}

	/**
	 * 通知重连最终失败
	 */
	private notifyReconnectFailed(): void {
		const message =
			`自动重连失败（已尝试 ${this.MAX_RECONNECT_ATTEMPTS} 次）\n\n` +
			`请检查：\n` +
			`1. 本地服务器是否运行 (ws://localhost:8765)\n` +
			`2. 网络连接是否正常\n` +
			`3. 防火墙设置\n\n` +
			`点击"重连到服务器"手动重试`;

		eda.sys_Dialog.showInformationMessage(message, '连接已断开');
		eda.sys_ToastMessage.showMessage('连接已断开', ESYS_ToastMessageType.ERROR);

		// 触发外部回调
		if (this.onDisconnectedCallback) {
			this.onDisconnectedCallback();
		}
	}

	/**
	 * 获取扩展状态
	 */
	private handleGetStatus(id: string): void {
		// 简化实现，暂不检测文档状态
		const result: ExtensionStatusResult = {
			connected: true,
			extensionVersion: '1.0.0',
			edaVersion: (eda as any).version || 'unknown',
			documentOpen: false,
			documentType: undefined,
		};
		this.send(id, result);
	}

	/**
	 * 显示Toast消息
	 */
	private handleShowMessage(id: string, params: ShowMessageParams): void {
		const typeMap: Record<string, ESYS_ToastMessageType> = {
			info: ESYS_ToastMessageType.INFO,
			warning: ESYS_ToastMessageType.WARNING,
			error: ESYS_ToastMessageType.ERROR,
			success: ESYS_ToastMessageType.SUCCESS,
		};

		eda.sys_ToastMessage.showMessage(params.message, typeMap[params.type || 'info'] ?? ESYS_ToastMessageType.INFO);
		this.send(id, { success: true });
	}

	/**
	 * 显示日志消息
	 */
	private handleLogMessage(id: string, params: LogMessageParams): void {
		const level = params.level || 'info';
		const message = `[服务器] ${params.message}`;

		switch (level) {
			case 'error':
				console.error(message);
				break;
			case 'warn':
				console.warn(message);
				break;
			case 'debug':
				console.debug(message);
				break;
			default:
				console.log(message);
		}

		this.send(id, { success: true });
	}

	/**
	 * 连接成功回调
	 */
	private onConnected(): void {
		this.isConnected = true;
		this.reconnectAttempts = 0; // 重置重连计数
		this.lastPongTime = Date.now(); // 初始化心跳时间
		this.lastPingTime = 0;
		this.isManualDisconnect = false; // 重置手动断开标志
		this.log('已成功连接到本地服务器');

		// 启动心跳检测
		this.startHeartbeat();

		// 触发外部设置的连接回调
		if (this.onConnectedCallback) {
			this.onConnectedCallback();
		}
	}

	/**
	 * 设置消息回调
	 */
	setOnMessage(callback: (method: string, params: unknown) => void): void {
		this.onMessageCallback = callback;
	}

	/**
	 * 设置连接成功回调
	 */
	setConnectionCallback(callback: () => void): void {
		this.onConnectedCallback = callback;
	}

	/**
	 * 设置断开连接回调
	 */
	setDisconnectionCallback(callback: () => void): void {
		this.onDisconnectedCallback = callback;
	}

	/**
	 * 日志输出
	 */
	private log(message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
		const prefix = '[WebSocket 客户端]';
		switch (type) {
			case 'error':
				console.error(prefix, message);
				break;
			case 'warn':
				console.warn(prefix, message);
				break;
			case 'success':
				console.log('%c' + prefix + ' ' + message, 'color: green; font-weight: bold');
				break;
			default:
				console.log(prefix, message);
		}
	}

	/**
	 * 处理 SCH 操作请求
	 */
	private async handleSCHRequest(
		id: string,
		method: string,
		params: Record<string, unknown>
	): Promise<void> {
		try {
			const operation = method.replace('sch.', '');

			let result: unknown;

			switch (operation) {
				case 'get_all_components':
					result = await this.schAdapter.getAllComponents(
						params as unknown as SCHGetAllComponentsParams
					);
					break;

				case 'get_component_by_designator':
					result = await this.schAdapter.getComponentByDesignator(
						params as unknown as SCHGetComponentByDesignatorParams
					);
					break;

				case 'get_component_pins':
					result = await this.schAdapter.getComponentPins(
						params as unknown as SCHGetComponentPinsParams
					);
					break;

				case 'get_netlist':
					result = await this.schAdapter.getNetlist(
						params as unknown as SCHGetNetlistParams
					);
					break;

				case 'get_bom':
					result = await this.schAdapter.getBom(
						params as unknown as SCHGetBomParams
					);
					break;

				default:
					this.sendError(id, -1, `未知的 SCH 操作: ${operation}`);
					return;
			}

			this.send(id, result);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.log(`SCH 操作失败: ${errorMessage}`, 'error');
			this.sendError(id, -1, errorMessage);
		}
	}

	/**
	 * 处理 PCB 操作请求
	 */
	private async handlePCBRequest(
		id: string,
		method: string,
		params: Record<string, unknown>
	): Promise<void> {
		try {
			const operation = method.replace('pcb.', '');

			let result: unknown;

			switch (operation) {
				// 项目管理
				case 'create_project':
					result = await this.pcbAdapter.createProject(params as any);
					break;
				case 'open_project':
					result = await this.pcbAdapter.openProject(params as any);
					break;
				case 'save_project':
					result = await this.pcbAdapter.saveProject();
					break;
				case 'get_project_info':
					result = await this.pcbAdapter.getProjectInfo();
					break;

				// 元件操作
				case 'place_component':
					result = await this.pcbAdapter.placeComponent(params as any);
					break;
				case 'move_component':
					result = await this.pcbAdapter.moveComponent(params as any);
					break;
				case 'rotate_component':
					result = await this.pcbAdapter.rotateComponent(params as any);
					break;
				case 'delete_component':
					result = await this.pcbAdapter.deleteComponent(params as any);
					break;
				case 'get_component':
					result = await this.pcbAdapter.getComponent(params as any);
					break;

				// 布线操作
				case 'route_trace':
					result = await this.pcbAdapter.routeTrace(params as any);
					break;
				case 'add_via':
					result = await this.pcbAdapter.addVia(params as any);
					break;
				case 'delete_trace':
					result = await this.pcbAdapter.deleteTrace(params as any);
					break;

				// 层管理
				case 'set_active_layer':
					result = await this.pcbAdapter.setActiveLayer(params as any);
					break;
				case 'get_layer_list':
					result = await this.pcbAdapter.getLayerList();
					break;
				case 'add_layer':
					result = await this.pcbAdapter.addLayer(params as any);
					break;

				// DRC 检查
				case 'run_drc':
					result = await this.pcbAdapter.runDRC(params as any);
					break;
				case 'get_drc_report':
					result = await this.pcbAdapter.getDRCReport();
					break;
				case 'clear_drc_markers':
					result = await this.pcbAdapter.clearDRCMarkers();
					break;
				case 'get_board_outline_size':
					result = await this.pcbAdapter.getBoardOutlineSize(params as any);
					break;
				case 'get_board_outline_position':
					result = await this.pcbAdapter.getBoardOutlinePosition();
					break;
				case 'get_all_components':
					result = await this.pcbAdapter.getAllComponents();
					break;
				case 'get_top_layer_components':
					result = await this.pcbAdapter.getTopLayerComponents();
					break;
				case 'get_bottom_layer_components':
					result = await this.pcbAdapter.getBottomLayerComponents();
					break;
				case 'find_component_by_designator':
					result = await this.pcbAdapter.findComponentByDesignator(params as any);
					break;
				case 'get_component_pads':
					result = await this.pcbAdapter.getComponentPads(params as any);
					break;
				case 'set_component_transform':
					result = await this.pcbAdapter.setComponentTransform(params as any);
					break;
				case 'generate_netlist_map':
					result = await this.pcbAdapter.generateNetlistMap();
					break;
				case 'get_layer_count':
					result = await this.pcbAdapter.getLayerCount();
					break;
				case 'calculate_component_relative_position':
					result = await this.pcbAdapter.calculateComponentRelativePosition(params as any);
					break;
				case 'find_nearby_components':
					result = await this.pcbAdapter.findNearbyComponents(params as any);
					break;
				case 'calculate_component_bounding_box':
					result = await this.pcbAdapter.calculateComponentBoundingBox(params as any);
					break;
				case 'check_component_collision':
					result = await this.pcbAdapter.checkComponentCollision(params as any);
					break;

				default:
					this.sendError(id, -1, `未知的 PCB 操作: ${operation}`);
					return;
			}

			this.send(id, result);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.log(`PCB 操作失败: ${errorMessage}`, 'error');
			this.sendError(id, -1, errorMessage);
		}
	}
}
