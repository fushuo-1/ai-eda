/**
 * WebSocket 通信协议类型定义
 *
 * 定义扩展与本地服务器之间的通信协议
 */

/**
 * WebSocket 请求格式（服务器→扩展）
 */
export interface WebSocketRequest {
	id: string;
	method: string;
	params: Record<string, unknown>;
}

/**
 * WebSocket 响应格式（扩展→服务器）
 */
export interface WebSocketResponse {
	id: string;
	result?: unknown;
	error?: WebSocketError;
}

/**
 * 错误信息
 */
export interface WebSocketError {
	code: number;
	message: string;
}

/**
 * 心跳请求参数
 */
export interface PingParams {
	timestamp: number;
}

/**
 * 心跳响应结果
 */
export interface PongResult {
	status: 'ok';
	timestamp: number;
	serverTime: number;
}

/**
 * 扩展状态查询结果
 */
export interface ExtensionStatusResult {
	connected: boolean;
	extensionVersion: string;
	edaVersion: string;
	documentOpen: boolean;
	documentType?: 'sch' | 'pcb' | 'unknown';
}

/**
 * 消息显示参数
 */
export interface ShowMessageParams {
	message: string;
	type?: 'info' | 'warning' | 'error' | 'success';
}

/**
 * 日志消息参数
 */
export interface LogMessageParams {
	message: string;
	level?: 'info' | 'warn' | 'error' | 'debug';
}

/**
 * 原理图元器件类型枚举
 */
export type SCHComponentType =
	| 'COMPONENT'
	| 'DRAWING'
	| 'NET_FLAG'
	| 'NET_PORT'
	| 'NET_LABEL'
	| 'NON_ELECTRICAL_FLAG'
	| 'SHORT_CIRCUIT_FLAG';

/**
 * 原理图元器件信息
 */
export interface SCHComponentInfo {
	/** 图元ID */
	primitiveId: string;
	/** 位号（R1, C1, U1） */
	designator: string;
	/** 名称（阻值、电容值等） */
	name: string;
	/** 器件类型 */
	type: SCHComponentType;
	/** 位置信息 */
	position: {
		x: number;
		y: number;
	};
	/** 旋转角度 */
	rotation: number;
	/** 是否镜像 */
	mirror: boolean;
	/** 是否加入BOM */
	addIntoBom: boolean;
	/** 是否转到PCB */
	addIntoPcb: boolean;
	/** 制造商 */
	manufacturer?: string;
	/** 供应商 */
	supplier?: string;
	/** 供应商编号 */
	supplierId?: string;
	/** 网络名称 */
	net?: string;
	/** 唯一ID */
	uniqueId?: string;
}

/**
 * 引脚信息
 */
export interface SCHPinInfo {
	/** 图元ID */
	primitiveId: string;
	/** 引脚编号 */
	pinNumber: string;
	/** 引脚名称 */
	pinName: string;
	/** 网络名称 */
	net?: string;
	/** 位置 */
	position: {
		x: number;
		y: number;
	};
	/** 旋转角度 */
	rotation: number;
}

/**
 * 获取所有元器件参数
 */
export interface SCHGetAllComponentsParams {
	/** 可选：器件类型过滤 */
	componentType?: SCHComponentType;
	/** 可选：是否获取所有原理图图页 */
	allSchematicPages?: boolean;
}

/**
 * 获取所有元器件结果
 */
export interface SCHGetAllComponentsResult {
	success: boolean;
	components?: SCHComponentInfo[];
	count?: number;
	error?: string;
}

/**
 * 根据位号获取元器件参数
 */
export interface SCHGetComponentByDesignatorParams {
	/** 位号（如 "Q4", "R1"） */
	designator: string;
}

/**
 * 根据位号获取元器件结果
 */
export interface SCHGetComponentByDesignatorResult {
	success: boolean;
	component?: SCHComponentInfo;
	error?: string;
}

/**
 * 获取元器件引脚参数
 */
export interface SCHGetComponentPinsParams {
	/** 元器件图元ID */
	primitiveId: string;
}

/**
 * 获取元器件引脚结果
 */
export interface SCHGetComponentPinsResult {
	success: boolean;
	pins?: SCHPinInfo[];
	count?: number;
	error?: string;
}

/**
 * PCB 板框尺寸信息
 */
export interface PCBBoardOutlineInfo {
	widthMM: number;
	heightMM: number;
	widthMil: number;
	heightMil: number;
	widthInch: number;
	heightInch: number;
	layer: number;
	primitiveId: string;
	outlineCount: number;
}

/**
 * 获取板框尺寸参数
 */
export interface PCBGetBoardOutlineSizeParams {
	unit?: 'mm' | 'mil' | 'inch';
}

/**
 * 获取板框尺寸结果
 */
export interface PCBGetBoardOutlineSizeResult {
	success: boolean;
	boardOutline?: PCBBoardOutlineInfo;
	error?: string;
}

/**
 * PCB 元器件变换参数（位置、旋转和层）
 */
export interface PCBSetComponentTransformParams {
	/** 元器件位号 */
	designator: string;
	/** X坐标（mil），可选 */
	x?: number;
	/** Y坐标（mil），可选 */
	y?: number;
	/** 旋转角度（度），可选 */
	rotation?: number;
	/** 层（1=TOP顶层，2=BOTTOM底层），可选 */
	layer?: number;
}

/**
 * PCB 元器件变换结果
 */
export interface PCBSetComponentTransformResult {
	success: boolean;
	component?: {
		designator: string;
		primitiveId: string;
		x: number;
		y: number;
		rotation: number;
		layer: number;
	};
	error?: string;
}

/**
 * PCB 层数统计信息
 */
export interface PCBLayerCountInfo {
	/** 是否有顶层 */
	topLayer: boolean;
	/** 是否有底层 */
	bottomLayer: boolean;
	/** 内层数量 */
	innerLayerCount: number;
	/** 总铜层数 */
	copperLayerCount: number;
	/** 所有图层定义数量 */
	allLayersCount: number;
	/** 已启用图层数量 */
	enabledLayersCount: number;
}

/**
 * 获取 PCB 层数结果
 */
export interface PCBGetLayerCountResult {
	success: boolean;
	layerCount?: PCBLayerCountInfo;
	error?: string;
}

/**
 * 计算元器件相对位置参数
 */
export interface PCBCalculateComponentRelativePositionParams {
	/** 第一个元器件位号 */
	designator1: string;
	/** 第二个元器件位号 */
	designator2: string;
	/** 输出单位（可选） */
	unit?: 'mm' | 'mil' | 'inch';
}

/**
 * 相对位置信息
 */
export interface RelativePositionInfo {
	/** 欧几里得距离（mil） */
	distanceMil: number;
	/** 欧几里得距离（mm） */
	distanceMM: number;
	/** 欧几里得距离（inch） */
	distanceInch: number;
	/** 角度（度，0-360） */
	angleDegrees: number;
	/** 角度（弧度） */
	angleRadians: number;
	/** 方位描述（8方向） */
	cardinalDirection: string;
	/** 方位描述（16方向） */
	detailedDirection: string;
}

/**
 * 元器件相对位置计算结果
 */
export interface PCBCalculateComponentRelativePositionResult {
	success: boolean;
	component1?: {
		designator: string;
		primitiveId: string;
		layer: number;
		x: number;
		y: number;
		rotation: number;
	};
	component2?: {
		designator: string;
		primitiveId: string;
		layer: number;
		x: number;
		y: number;
		rotation: number;
	};
	relativePosition?: RelativePositionInfo;
	sameLayer?: boolean;
	error?: string;
}

// ====================================================================
// SCH Netlist Types (原理图网表类型)
// ====================================================================

/**
 * 网表引脚连接
 */
export interface SCHNetlistPin {
	designator: string;
	pin: string;
}

/**
 * 网表网络
 */
export interface SCHNetlistNet {
	name: string;
	pins: SCHNetlistPin[];
}

/**
 * 网表元器件
 */
export interface SCHNetlistComponent {
	designator: string;
	footprint: string;
	value: string;
}

/**
 * 引脚到网络映射
 */
export interface SCHPinToNetworkMap {
	[key: string]: string; // "designator-pin" -> networkName
}

/**
 * 获取网表参数
 */
export interface SCHGetNetlistParams {
	/** 是否包含原始网表字符串 */
	includeRaw?: boolean;
}

/**
 * 网表统计信息
 */
export interface SCHNetlistStats {
	totalComponents: number;
	totalNets: number;
	totalConnections: number;
}

/**
 * 获取网表结果
 */
export interface SCHGetNetlistResult {
	success: boolean;
	components?: SCHNetlistComponent[];
	nets?: SCHNetlistNet[];
	pinToNetworkMap?: SCHPinToNetworkMap;
	stats?: SCHNetlistStats;
	rawNetlist?: string;
	error?: string;
}

// ====================================================================
// SCH BOM Types (原理图BOM类型)
// ====================================================================

/**
 * BOM 组件条目
 */
export interface SCHBOMComponent {
	designator: string;
	value: string;
	footprint: string;
	manufacturer?: string;
	supplier?: string;
	supplierId?: string;
	addIntoBom: boolean;
	addIntoPcb: boolean;
}

/**
 * BOM 分组条目
 */
export interface SCHBOMGroupedEntry {
	value: string;
	footprint: string;
	designators: string[];
	count: number;
	manufacturer?: string;
	supplier?: string;
	supplierId?: string;
}

/**
 * BOM 统计信息
 */
export interface SCHBOMStats {
	totalComponents: number;
	bomComponents: number;
	nonBomComponents: number;
	uniquePartNumbers: number;
}

/**
 * 获取 BOM 参数
 */
export interface SCHGetBomParams {
	/** 是否按值和封装分组（默认: true） */
	groupByValue?: boolean;
	/** 是否包含非 BOM 组件（默认: false） */
	includeNonBom?: boolean;
}

/**
 * 获取 BOM 结果
 */
export interface SCHGetBomResult {
	success: boolean;
	components?: SCHBOMComponent[];
	grouped?: SCHBOMGroupedEntry[];
	stats?: SCHBOMStats;
	error?: string;
}
