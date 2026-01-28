/**
 * 入口文件
 *
 * WebSocket Bridge 扩展入口
 */
import * as extensionConfig from '../extension.json';
import { ConnectionManager } from './connection-manager.js';

/**
 * 全局命名空间（用于持久化状态）
 */
declare global {
	// eslint-disable-next-line no-var
	var _jlcedaWebSocketBridge: {
		connectionManager?: ConnectionManager;
		connectionStatus?: '已连接' | '已断开';  // 连接状态
	} | undefined;
}

/**
 * 获取全局连接管理器实例
 */
function getGlobalState(): NonNullable<typeof globalThis._jlcedaWebSocketBridge> {
	if (!globalThis._jlcedaWebSocketBridge) {
		globalThis._jlcedaWebSocketBridge = {};
	}
	return globalThis._jlcedaWebSocketBridge!;
}

//
export function activate(status?: 'onStartupFinished', arg?: string): void {

}

//初始化插件实例
export function init(): void {

	const globalState = getGlobalState();

	// 防止重复初始化
	if (globalState.connectionManager) {
		console.log('[WebSocket Bridge] 插件已初始化，跳过');
		eda.sys_ToastMessage.showMessage('插件已初始化', ESYS_ToastMessageType.INFO);
		return;
	}

	console.log('[WebSocket Bridge] 初始插件');

	try {
		// 创建连接管理器
		globalState.connectionManager = new ConnectionManager();

		// 初始化成功
		eda.sys_ToastMessage.showMessage('插件初始化成功', ESYS_ToastMessageType.SUCCESS);
		console.log('[WebSocket Bridge] 插件初始化完成');
	} catch (error) {
		// 初始化失败
		eda.sys_ToastMessage.showMessage('插件初始化失败', ESYS_ToastMessageType.ERROR);
		console.error('[WebSocket Bridge] 初始化失败:', error);
		globalState.connectionManager = undefined;
	}

}

/**
 * 菜单项：连接到服务器
 */
export async function connectToServer(): Promise<void> {
	const globalState = getGlobalState();

	// 检查是否已初始化
	if (!globalState.connectionManager) {
		eda.sys_ToastMessage.showMessage('请先初始化插件', ESYS_ToastMessageType.WARNING);
		return;
	}

	// 检查是否已连接
	if (globalState.connectionManager.isConnected()) {
		eda.sys_ToastMessage.showMessage('已连接到服务器', ESYS_ToastMessageType.INFO);

		return;
	}

	// 显示连接中提示
	eda.sys_ToastMessage.showMessage('正在连接到本地服务器...', ESYS_ToastMessageType.INFO);
	console.log('[WebSocket Bridge] 开始连接...');

	try {
		// 调用连接管理器启动连接
		await globalState.connectionManager.start();
	} catch (error) {
		// 错误处理
		const errorMessage = error instanceof Error ? error.message : String(error);
		eda.sys_ToastMessage.showMessage('连接失败', ESYS_ToastMessageType.ERROR);
		console.error('[WebSocket Bridge] 连接失败:', errorMessage);
	}
}

/**
 * 菜单项：显示连接状态
 */
export function showConnectionStatus(): void {
	const globalState = getGlobalState();

	// 检查是否已初始化
	if (!globalState.connectionManager) {
		eda.sys_Dialog.showInformationMessage('插件未初始化\n\n请先点击"初始插件"菜单', '连接状态');
		return;
	}

	const isConnected = globalState.connectionManager.isConnected();
	const status = isConnected ? '已连接' : '已断开';
	const serverUrl = 'ws://localhost:8765';

	// 如果未连接，添加重连提示
	const reconnectInfo = isConnected
		? ''
		: '\n\n提示: 点击"重连到服务器"可尝试重新连接';

	eda.sys_Dialog.showInformationMessage(
		`状态: ${status}\n服务器: ${serverUrl}\n\n扩展版本: ${extensionConfig.version}${reconnectInfo}`,
		'连接状态'
	);
	console.log(`[WebSocket Bridge] 连接状态: ${status}`);
}

/**
 * 菜单项：重连到服务器
 */
export async function reconnectToServer(): Promise<void> {
	const globalState = getGlobalState();

	// 检查是否已初始化
	if (!globalState.connectionManager) {
		eda.sys_ToastMessage.showMessage('请先初始化插件', ESYS_ToastMessageType.WARNING);
		return;
	}

	// 检查当前连接状态
	const wasConnected = globalState.connectionManager.isConnected();

	if (wasConnected) {
		// 已连接状态：显示"正在重新连接"
		eda.sys_ToastMessage.showMessage('正在重新连接到本地服务器...', ESYS_ToastMessageType.INFO);
		console.log('[WebSocket Bridge] 正在重新连接服务器');
	} else {
		// 未连接状态：提示用户
		eda.sys_ToastMessage.showMessage('当前未连接，正在建立连接...', ESYS_ToastMessageType.INFO);
		console.log('[WebSocket Bridge] 当前未连接，开始建立连接');
	}

	try {
		// 调用重连方法
		await globalState.connectionManager.reconnect();
	} catch (error) {
		// 错误处理
		const errorMessage = error instanceof Error ? error.message : String(error);
		eda.sys_ToastMessage.showMessage('重连失败', ESYS_ToastMessageType.ERROR);
		console.error('[WebSocket Bridge] 重连失败:', errorMessage);
	}
}

/**
 * 菜单项：断开服务器连接
 */
export function disconnectFromServer(): void {
	const globalState = getGlobalState();

	// 检查是否已初始化
	if (!globalState.connectionManager) {
		eda.sys_ToastMessage.showMessage('连接管理器未初始化', ESYS_ToastMessageType.WARNING);
		return;
	}

	// 检查是否已连接
	if (!globalState.connectionManager.isConnected()) {
		eda.sys_ToastMessage.showMessage('当前未连接到服务器', ESYS_ToastMessageType.WARNING);
		return;
	}

	// 断开连接
	globalState.connectionManager.stop();
	eda.sys_ToastMessage.showMessage('已断开与本地服务器的连接', ESYS_ToastMessageType.SUCCESS);
	console.log('[WebSocket Bridge] 已断开连接');
}

// /**
//  * 菜单项：测试原理图 DRC
//  */
// export async function testSchematicDRC(): Promise<void> {
// 	console.log('[SCH DRC] 开始测试原理图设计规则检查...');

// 	try {
// 		eda.sys_ToastMessage.showMessage('正在运行 DRC 检查...', ESYS_ToastMessageType.INFO);

// 		// 1. 测试 DRC 检查（严格模式，不显示UI）
// 		console.log('[SCH DRC] 运行 DRC 检查（严格模式）...');
// 		const drcResult1 = await eda.sch_Drc.check(true, false);
// 		console.log('[SCH DRC] DRC 检查结果（严格模式）:');
// 		console.log(drcResult1);

// 		// 2. 测试 DRC 检查（宽松模式，不显示UI）
// 		console.log('[SCH DRC] 运行 DRC 检查（宽松模式）...');
// 		const drcResult2 = await eda.sch_Drc.check(false, false);
// 		console.log('[SCH DRC] DRC 检查结果（宽松模式）:');
// 		console.log(drcResult2);

// 		// 3. 分析结果
// 		console.log('[SCH DRC] 分析 DRC 结果...');

// 		// 尝试解析结果对象
// 		const result = drcResult1;

// 		let summary = 'DRC 检查完成\n\n';

// 		if (result) {
// 			if (typeof result === 'object') {
// 				// 如果结果是对象，列出所有属性
// 				console.log('[SCH DRC] 结果对象属性:');
// 				for (const key in result) {
// 					const value = result[key];
// 					console.log(`  ${key}:`, value);
// 					summary += `${key}: ${JSON.stringify(value)}\n`;
// 				}
// 			} else if (typeof result === 'string') {
// 				summary += `结果: ${result}\n`;
// 			} else if (typeof result === 'boolean') {
// 				summary += `检查通过: ${result ? '是' : '否'}\n`;
// 			}
// 		} else {
// 			summary += '未返回结果\n';
// 		}

// 		// 4. 显示结果对话框
// 		eda.sys_Dialog.showInformationMessage(summary, '原理图 DRC 检查');
// 		eda.sys_ToastMessage.showMessage('DRC 检查完成', ESYS_ToastMessageType.SUCCESS);

// 		console.log('[SCH DRC] 测试完成！');
// 	} catch (error) {
// 		const errorMessage = error instanceof Error ? error.message : String(error);
// 		eda.sys_ToastMessage.showMessage('DRC 检查失败', ESYS_ToastMessageType.ERROR);
// 		console.error('[SCH DRC] 错误:', errorMessage);
// 	}
// }

// /**
//  * 菜单项：探索引脚对象属性
//  */
// export async function explorePinProperties(): Promise<void> {
// 	console.log('[Pin Explorer] 开始探索引脚对象属性...');

// 	try {
// 		eda.sys_ToastMessage.showMessage('正在探索引脚对象...', ESYS_ToastMessageType.INFO);

// 		// 1. 获取所有元器件
// 		console.log('[Pin Explorer] 获取所有元器件...');
// 		const allComponents = await eda.sch_PrimitiveComponent.getAll();

// 		if (!allComponents || allComponents.length === 0) {
// 			eda.sys_ToastMessage.showMessage('未找到元器件', ESYS_ToastMessageType.WARNING);
// 			return;
// 		}

// 		console.log(`[Pin Explorer] 找到 ${allComponents.length} 个元器件`);

// 		// 2. 获取第一个元器件
// 		const firstComponent = allComponents[0];
// 		const designator = firstComponent.getState_Designator();
// 		const primitiveId = firstComponent.getState_PrimitiveId();

// 		console.log(`[Pin Explorer] 分析元器件: ${designator} (ID: ${primitiveId})`);

// 		// 3. 获取该元器件的所有引脚
// 		console.log('[Pin Explorer] 获取引脚列表...');
// 		const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(primitiveId);

// 		if (!pins || pins.length === 0) {
// 			eda.sys_ToastMessage.showMessage('该元器件没有引脚', ESYS_ToastMessageType.WARNING);
// 			return;
// 		}

// 		console.log(`[Pin Explorer] 找到 ${pins.length} 个引脚`);

// 		// 4. 分析第一个引脚的所有属性
// 		const firstPin = pins[0];
// 		console.log('[Pin Explorer] 第一个引脚的完整对象:');
// 		console.log(firstPin);

// 		// 5. 列出引脚的所有方法和属性
// 		console.log('[Pin Explorer] 引脚对象的所有方法:');
// 		const pinMethods = [];
// 		for (const key in firstPin) {
// 			if (typeof firstPin[key] === 'function') {
// 				pinMethods.push(key);
// 			}
// 		}
// 		console.log('方法列表:', pinMethods);

// 		console.log('[Pin Explorer] 引脚对象的所有属性:');
// 		const pinProperties = [];
// 		for (const key in firstPin) {
// 			if (typeof firstPin[key] !== 'function') {
// 				const value = firstPin[key];
// 				pinProperties.push({ key, value, type: typeof value });
// 				console.log(`  ${key}:`, value, `(类型: ${typeof value})`);
// 			}
// 		}

// 		// 6. 尝试调用常见的方法
// 		console.log('[Pin Explorer] 尝试调用 getState 方法:');
// 		const stateMethods = pinMethods.filter(m => m.startsWith('getState_'));
// 		stateMethods.forEach(method => {
// 			try {
// 				const result = firstPin[method]();
// 				console.log(`  ${method}():`, result);
// 			} catch (error) {
// 				console.log(`  ${method}(): [错误] ${error}`);
// 			}
// 		});

// 		// 7. 检查是否有 net 相关的属性或方法
// 		console.log('[Pin Explorer] 查找 net 相关的属性/方法:');
// 		const netRelated = [...pinMethods, ...pinProperties.map(p => p.key)]
// 			.filter(name => name.toLowerCase().includes('net'));

// 		if (netRelated.length > 0) {
// 			console.log('  找到以下 net 相关项:', netRelated);
// 			netRelated.forEach(name => {
// 				try {
// 					if (typeof firstPin[name] === 'function') {
// 						console.log(`    ${name}():`, firstPin[name]());
// 					} else {
// 						console.log(`    ${name}:`, firstPin[name]);
// 					}
// 				} catch (error) {
// 					console.log(`    ${name}: [错误] ${error}`);
// 				}
// 			});
// 		} else {
// 			console.log('  未找到 net 相关的属性或方法');
// 		}

// 		// 8. 显示结果对话框
// 		const summary = `元器件: ${designator}\n` +
// 			`引脚数: ${pins.length}\n\n` +
// 			`探索结果已输出到控制台\n\n` +
// 			`请按 F12 查看详细信息`;

// 		eda.sys_Dialog.showInformationMessage(summary, '引脚对象探索');
// 		eda.sys_ToastMessage.showMessage('探索完成', ESYS_ToastMessageType.SUCCESS);
// 	} catch (error) {
// 		const errorMessage = error instanceof Error ? error.message : String(error);
// 		eda.sys_ToastMessage.showMessage('探索失败', ESYS_ToastMessageType.ERROR);
// 		console.error('[Pin Explorer] 错误:', errorMessage);
// 	}
// }

/**
 * 菜单项：关于
 */
export function about(): void {
	const version = extensionConfig.version;
	const message = `WebSocket Bridge v${version}\n\n嘉立创EDA Pro 本地 WebSocket 连接\n\n服务器: ws://localhost:8765\n\n功能:\n- 连接到本地 MCP 服务器\n- 支持 PCB 操作和控制\n- 实时双向通信`;

	eda.sys_Dialog.showInformationMessage(message, '关于 WebSocket 桥接器');
}
