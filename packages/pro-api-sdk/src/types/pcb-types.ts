/**
 * PCB API 类型定义
 *
 * 提取所有 PCB 相关的类型定义
 */

/**
 * 元器件信息
 */
export interface ComponentInfo {
	designator: string;
	primitiveId: string;
	layer: number;
	x: number;
	y: number;
	rotation: number;
}

/**
 * 带层名称的元器件信息
 */
export interface ComponentInfoWithLayer extends ComponentInfo {
	layerName: string;
}

/**
 * 焊盘信息
 */
export interface PadInfo {
	padNumber: string;
	primitiveId: string;
	x: number;
	y: number;
}

/**
 * 板框尺寸信息
 */
export interface BoardOutlineSize {
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
 * 边界框信息
 */
export interface BoundingBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	centerX: number;
	centerY: number;
	width: number;
	height: number;
}

/**
 * 顶点信息
 */
export interface Vertex {
	x: number;
	y: number;
	type: string;
}

/**
 * 板框位置信息
 */
export interface BoardOutlinePosition {
	primitiveId: string;
	layer: number;
	boundingBox: BoundingBox;
	vertices: Vertex[];
	outlineCount: number;
}

/**
 * 层统计信息
 */
export interface LayerCount {
	topLayer: boolean;
	bottomLayer: boolean;
	innerLayerCount: number;
	copperLayerCount: number;
	allLayersCount: number;
	enabledLayersCount: number;
}

/**
 * 网表映射中的引脚信息
 */
export interface NetPin {
	designator: string;
	padNumber: string;
	x: number;
	y: number;
}

/**
 * 网表统计信息
 */
export interface NetlistStats {
	totalNets: number;
	totalConnections: number;
	totalComponents: number;
	avgPinsPerNet: number;
}

/**
 * 网络引脚数统计
 */
export interface TopNet {
	net: string;
	pinCount: number;
}

/**
 * 焊盘几何信息（用于边界盒计算）
 */
export interface PadGeometry {
	padNumber: string;
	primitiveId: string;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number;
	shape: 'rect' | 'circle' | 'oval' | 'polygon';
}

/**
 * 元器件封装边界盒信息
 */
export interface ComponentBoundingBox {
	// 原始封装尺寸（未考虑元器件旋转）
	unrotated: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
		centerX: number;
		centerY: number;
		width: number;
		height: number;
	};

	// 旋转后占用尺寸（未考虑安全裕量）
	raw: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
		centerX: number;
		centerY: number;
		width: number;
		height: number;
	};

	// 实际边界盒（含安全裕量）
	actual: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
		centerX: number;
		centerY: number;
		width: number;
		height: number;
	};

	// 多单位尺寸
	dimensions: {
		unrotated: {
			widthMM: number;
			widthMil: number;
			widthInch: number;
			heightMM: number;
			heightMil: number;
			heightInch: number;
		};
		raw: {
			widthMM: number;
			widthMil: number;
			widthInch: number;
			heightMM: number;
			heightMil: number;
			heightInch: number;
		};
		actual: {
			widthMM: number;
			widthMil: number;
			widthInch: number;
			heightMM: number;
			heightMil: number;
			heightInch: number;
		};
	};

	// 元器件基本信息
	component: {
		designator: string;
		primitiveId: string;
		layer: number;
		x: number;
		y: number;
		rotation: number;
	};

	// 计算详情
	calculationDetails: {
		padCount: number;
		safetyMarginMil: number;
		safetyMarginMM: number;
		executionTimeMs: number;
		warnings?: string[];
	};
}

/**
 * 碰撞检测违规类型
 */
export type CollisionViolationType = 'spacing' | 'overlap' | 'both';

/**
 * 间距违规详情
 */
export interface SpacingViolation {
	actual: number;
	required: number;
	deficit: number;
	unit: string;
}

/**
 * 重叠违规详情
 */
export interface OverlapViolation {
	detected: boolean;
	area?: number; // 重叠面积（平方 mil）
	boundingBox: BoundingBox;
}

/**
 * 碰撞检测违规信息
 */
export interface CollisionViolation {
	designator: string;
	position: {
		x: number;
		y: number;
	};
	layer: number;
	violationType: CollisionViolationType;
	spacing?: SpacingViolation;
	overlap?: OverlapViolation;
	distance: {
		mil: number;
		mm: number;
		inch: number;
	};
	angle: number;
	direction: string;
}

/**
 * 碰撞检测统计信息
 */
export interface CollisionCheckStatistics {
	totalChecked: number;
	violationsFound: number;
	spacingViolations: number;
	overlapViolations: number;
	executionTimeMs: number;
}

/**
 * 碰撞检测警告
 */
export interface CollisionWarning {
	type: 'spacing' | 'overlap' | 'calculation';
	message: string;
	severity: 'info' | 'warning' | 'error';
}

/**
 * 碰撞检测结果
 */
export interface CollisionCheckResult {
	success: boolean;
	reference: {
		designator: string;
		position: {
			x: number;
			y: number;
		};
		layer: number;
		boundingBox?: {
			raw: BoundingBox;
			actual?: BoundingBox;
		};
	};
	violations: CollisionViolation[];
	statistics: CollisionCheckStatistics;
	warnings: CollisionWarning[];
}
