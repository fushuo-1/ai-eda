/**
 * 元器件查询适配器
 */

import { BasePCBAdapter } from '../base/base-pcb-adapter';
import type {
	ComponentInfo,
	ComponentInfoWithLayer,
	PadInfo,
	PadGeometry,
	ComponentBoundingBox,
	CollisionCheckResult,
	CollisionViolation,
	CollisionViolationType,
	CollisionWarning,
	CollisionCheckStatistics,
} from '../../types/pcb-types';

export class ComponentQueryAdapter extends BasePCBAdapter {
	constructor() {
		super('ComponentQuery');
	}

	async getTopLayerComponents(): Promise<{
		success: boolean;
		components?: ComponentInfo[];
		count?: number;
		error?: string;
	}> {
		try {
			this.logger.log('Getting top layer components...');

			const topComponents = await eda.pcb_PrimitiveComponent.getAll(1, undefined);

			if (!topComponents || topComponents.length === 0) {
				return {
					success: false,
					error: '顶层未找到元器件',
				};
			}

			this.logger.log(`Found ${topComponents.length} top layer components`);

			const componentList = this.mapComponentList(topComponents);

			return {
				success: true,
				components: componentList,
				count: componentList.length,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('getTopLayerComponents error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async getBottomLayerComponents(): Promise<{
		success: boolean;
		components?: ComponentInfo[];
		count?: number;
		error?: string;
	}> {
		try {
			this.logger.log('Getting bottom layer components...');

			const bottomComponents = await eda.pcb_PrimitiveComponent.getAll(2, undefined);

			if (!bottomComponents || bottomComponents.length === 0) {
				return {
					success: false,
					error: '底层未找到元器件',
				};
			}

			this.logger.log(`Found ${bottomComponents.length} bottom layer components`);

			const componentList = this.mapComponentList(bottomComponents);

			return {
				success: true,
				components: componentList,
				count: componentList.length,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('getBottomLayerComponents error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async getAllComponents(): Promise<{
		success: boolean;
		components?: ComponentInfoWithLayer[];
		stats?: {
			total: number;
			topLayer: number;
			bottomLayer: number;
		};
		error?: string;
	}> {
		try {
			this.logger.log('Getting all components...');

			const allComponents = await eda.pcb_PrimitiveComponent.getAll();

			if (!allComponents || allComponents.length === 0) {
				return {
					success: false,
					error: '未找到任何元器件',
				};
			}

			this.logger.log(`Found ${allComponents.length} total components`);

			const componentList = allComponents.map(comp => {
				const layer = comp.getState_Layer() as number;
				return {
					designator: comp.getState_Designator() || '',
					primitiveId: comp.getState_PrimitiveId(),
					layer,
					layerName: layer === 1 ? 'TOP' : layer === 2 ? 'BOTTOM' : `Layer ${layer}`,
					x: comp.getState_X(),
					y: comp.getState_Y(),
					rotation: comp.getState_Rotation(),
				};
			});

			const topLayerCount = allComponents.filter(c => c.getState_Layer() === 1).length;
			const bottomLayerCount = allComponents.filter(c => c.getState_Layer() === 2).length;

			return {
				success: true,
				components: componentList,
				stats: {
					total: allComponents.length,
					topLayer: topLayerCount,
					bottomLayer: bottomLayerCount,
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('getAllComponents error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async findComponentByDesignator(params: { designator: string }): Promise<{
		success: boolean;
		component?: ComponentInfo;
		error?: string;
	}> {
		try {
			this.logger.log('Finding component:', params);

			const target = await this.findComponentByDesignatorInternal(params.designator);
			this.logger.log(`Found component ${params.designator}`);

			return {
				success: true,
				component: {
					designator: target.getState_Designator() || params.designator,
					primitiveId: target.getState_PrimitiveId(),
					layer: target.getState_Layer() as number,
					x: target.getState_X(),
					y: target.getState_Y(),
					rotation: target.getState_Rotation(),
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('findComponentByDesignator error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async getComponentPads(params: { primitiveId: string }): Promise<{
		success: boolean;
		pads?: PadInfo[];
		count?: number;
		error?: string;
	}> {
		try {
			this.logger.log('Getting component pads:', params);

			const pads = await eda.pcb_PrimitiveComponent.getAllPinsByPrimitiveId(params.primitiveId);

			if (!pads || pads.length === 0) {
				return {
					success: false,
					error: '该元器件没有焊盘或获取失败',
				};
			}

			this.logger.log(`Found ${pads.length} pads`);

			const padList = pads.map(pad => ({
				padNumber: pad.getState_PadNumber(),
				primitiveId: pad.getState_PrimitiveId(),
				x: pad.getState_X(),
				y: pad.getState_Y(),
			}));

			return {
				success: true,
				pads: padList,
				count: padList.length,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('getComponentPads error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 计算两个元器件的相对位置
	 */
	async calculateComponentRelativePosition(params: {
		designator1: string;
		designator2: string;
		unit?: 'mm' | 'mil' | 'inch';
	}): Promise<{
		success: boolean;
		component1?: ComponentInfo;
		component2?: ComponentInfo;
		relativePosition?: {
			distanceMil: number;
			distanceMM: number;
			distanceInch: number;
			angleDegrees: number;
			angleRadians: number;
			cardinalDirection: string;
			detailedDirection: string;
		};
		sameLayer?: boolean;
		error?: string;
	}> {
		try {
			this.logger.log('Calculating relative position:', params);

			// 1. 查找两个元器件
			const comp1 = await this.findComponentByDesignatorInternal(params.designator1);
			const comp2 = await this.findComponentByDesignatorInternal(params.designator2);

			// 2. 提取位置信息
			const x1 = comp1.getState_X();
			const y1 = comp1.getState_Y();
			const layer1 = comp1.getState_Layer() as number;

			const x2 = comp2.getState_X();
			const y2 = comp2.getState_Y();
			const layer2 = comp2.getState_Layer() as number;

			// 3. 计算欧几里得距离（mil）
			const dx = x2 - x1;
			const dy = y2 - y1;
			const distanceMil = Math.sqrt(dx * dx + dy * dy);

			// 4. 转换单位
			const distanceMM = distanceMil * 0.0254;
			const distanceInch = distanceMil / 1000;

			// 5. 计算角度（从comp1指向comp2）
			// Math.atan2返回弧度，范围 [-π, π]
			let angleRadians = Math.atan2(dy, dx);
			let angleDegrees = angleRadians * (180 / Math.PI);

			// 标准化到 [0, 360]
			if (angleDegrees < 0) {
				angleDegrees += 360;
				angleRadians = angleDegrees * (Math.PI / 180);
			}

			// 6. 计算方位描述
			const cardinalDirection = this.getCardinalDirection(angleDegrees);
			const detailedDirection = this.getDetailedDirection(angleDegrees);

			// 7. 检查层级
			const sameLayer = layer1 === layer2;

			this.logger.log(`Position calculated: ${distanceMM.toFixed(2)}mm, ${angleDegrees.toFixed(1)}°`);

			return {
				success: true,
				component1: {
					designator: comp1.getState_Designator() || params.designator1,
					primitiveId: comp1.getState_PrimitiveId(),
					layer: layer1,
					x: x1,
					y: y1,
					rotation: comp1.getState_Rotation(),
				},
				component2: {
					designator: comp2.getState_Designator() || params.designator2,
					primitiveId: comp2.getState_PrimitiveId(),
					layer: layer2,
					x: x2,
					y: y2,
					rotation: comp2.getState_Rotation(),
				},
				relativePosition: {
					distanceMil,
					distanceMM,
					distanceInch,
					angleDegrees,
					angleRadians,
					cardinalDirection,
					detailedDirection,
				},
				sameLayer,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('calculateComponentRelativePosition error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 获取8方向方位描述
	 */
	private getCardinalDirection(angle: number): string {
		const normalizedAngle = ((angle % 360) + 360) % 360;

		const directions = [
			{ start: 337.5, end: 22.5, name: '东' },
			{ start: 22.5, end: 67.5, name: '东北' },
			{ start: 67.5, end: 112.5, name: '北' },
			{ start: 112.5, end: 157.5, name: '西北' },
			{ start: 157.5, end: 202.5, name: '西' },
			{ start: 202.5, end: 247.5, name: '西南' },
			{ start: 247.5, end: 292.5, name: '南' },
			{ start: 292.5, end: 337.5, name: '东南' },
		];

		for (const dir of directions) {
			// 处理跨越0度的特殊情况
			if (dir.start > dir.end) {
				if (normalizedAngle >= dir.start || normalizedAngle < dir.end) {
					return dir.name;
				}
			} else {
				if (normalizedAngle >= dir.start && normalizedAngle < dir.end) {
					return dir.name;
				}
			}
		}

		return '东';
	}

	/**
	 * 获取16方向详细方位描述
	 */
	private getDetailedDirection(angle: number): string {
		const normalizedAngle = ((angle % 360) + 360) % 360;

		const directions = [
			{ start: 348.75, end: 11.25, name: '正东' },
			{ start: 11.25, end: 33.75, name: '东偏东北' },
			{ start: 33.75, end: 56.25, name: '东北' },
			{ start: 56.25, end: 78.75, name: '北偏东北' },
			{ start: 78.75, end: 101.25, name: '正北' },
			{ start: 101.25, end: 123.75, name: '北偏西北' },
			{ start: 123.75, end: 146.25, name: '西北' },
			{ start: 146.25, end: 168.75, name: '西偏西北' },
			{ start: 168.75, end: 191.25, name: '正西' },
			{ start: 191.25, end: 213.75, name: '西偏西南' },
			{ start: 213.75, end: 236.25, name: '西南' },
			{ start: 236.25, end: 258.75, name: '南偏西南' },
			{ start: 258.75, end: 281.25, name: '正南' },
			{ start: 281.25, end: 303.75, name: '南偏东南' },
			{ start: 303.75, end: 326.25, name: '东南' },
			{ start: 326.25, end: 348.75, name: '东偏东南' },
		];

		for (const dir of directions) {
			if (dir.start > dir.end) {
				if (normalizedAngle >= dir.start || normalizedAngle < dir.end) {
					return dir.name;
				}
			} else {
				if (normalizedAngle >= dir.start && normalizedAngle < dir.end) {
					return dir.name;
				}
			}
		}

		return '正东';
	}

	/**
	 * 获取方向字符串（8方向）
	 */
	private getDirectionString(angle: number): string {
		return this.getCardinalDirection(angle);
	}

	/**
	 * 查找邻近器件
	 */
	async findNearbyComponents(params: {
		referenceDesignator: string;
		searchMode: 'knn' | 'radius' | 'direction' | 'collision';
		k?: number;
		maxDistance?: number;
		unit?: 'mm' | 'mil' | 'inch';
		direction?: 'all' | 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
		layer?: 'top' | 'bottom' | 'all';
		includeReference?: boolean;
		excludeDesignators?: string[];
		minDistance?: number;
		sortBy?: 'distance' | 'angle' | 'designator';
		useBoundingBoxOverlap?: boolean;       // 默认: true，启用边界盒重叠检测
		boundingBoxType?: 'raw' | 'actual';    // 默认: 'raw'，边界盒类型
	}): Promise<{
		success: boolean;
		reference?: {
			designator: string;
			position: { x: number; y: number };
			layer: number;
		};
		nearbyComponents?: Array<{
			designator: string;
			position: { x: number; y: number };
			layer: number;
			rotation: number;
			distance: { mil: number; mm: number; inch: number };
			angle: number;
			direction: string;
			detailedDirection: string;
			overlapping: boolean;
			boundingBox?: {
				minX: number;
				minY: number;
				maxX: number;
				maxY: number;
				width: number;
				height: number;
				type: 'raw' | 'actual';
			};
		}>;
		statistics?: {
			totalFound: number;
			searched: number;
			executionTime: number;
			density?: number;
		};
		warnings?: Array<{
			type: string;
			message: string;
			severity: string;
		}>;
		error?: string;
	}> {
		try {
			const startTime = Date.now();
			this.logger.log('Finding nearby components:', params);

			// 1. 获取参考器件
			const reference = await this.findComponentByDesignatorInternal(params.referenceDesignator);
			const refX = reference.getState_X();
			const refY = reference.getState_Y();
			const refLayer = reference.getState_Layer() as number;

			// 2. 获取所有候选器件
			let allComponents = await eda.pcb_PrimitiveComponent.getAll();

			// 3. 层级过滤
			if (params.layer === 'top') {
				allComponents = allComponents.filter(c => c.getState_Layer() === 1);
			} else if (params.layer === 'bottom') {
				allComponents = allComponents.filter(c => c.getState_Layer() === 2);
			}

			// 4. 排除参考器件
			if (!params.includeReference) {
				allComponents = allComponents.filter(c => c.getState_PrimitiveId() !== reference.getState_PrimitiveId());
			}

			// 5. 排除指定器件
			if (params.excludeDesignators && params.excludeDesignators.length > 0) {
				allComponents = allComponents.filter(c => {
					const designator = c.getState_Designator();
					return designator ? !params.excludeDesignators!.includes(designator) : true;
				});
			}

			// 6. 单位转换系数（输入单位 -> mil）
			let unitMultiplier = 1; // 默认 mil
			if (params.unit === 'mm') {
				unitMultiplier = 39.3701; // 1 mm = 39.37 mil
			} else if (params.unit === 'inch') {
				unitMultiplier = 1000; // 1 inch = 1000 mil
			}

			// 7. 计算每个候选器件的距离和角度
			const candidates = [];
			const warnings = [];

			for (const comp of allComponents) {
				const x = comp.getState_X();
				const y = comp.getState_Y();
				const dx = x - refX;
				const dy = y - refY;
				const distanceMil = Math.sqrt(dx * dx + dy * dy);

				// 距离单位转换
				const distanceMM = distanceMil * 0.0254;
				const distanceInch = distanceMil / 1000;

				// 计算角度
				let angleRadians = Math.atan2(dy, dx);
				let angleDegrees = angleRadians * (180 / Math.PI);
				if (angleDegrees < 0) {
					angleDegrees += 360;
					angleRadians = angleDegrees * (Math.PI / 180);
				}

				// 方向判定
				const cardinalDirection = this.getCardinalDirection(angleDegrees);
				const detailedDirection = this.getDetailedDirection(angleDegrees);

				candidates.push({
					component: comp,
					distanceMil,
					distanceMM,
					distanceInch,
					angleDegrees,
					angleRadians,
					cardinalDirection,
					detailedDirection,
				});
			}

			// 8. 根据查询模式进行过滤
			let filtered = candidates;

			if (params.searchMode === 'knn') {
				// KNN模式：按距离排序并取前K个
				const k = params.k || 5;
				filtered.sort((a, b) => a.distanceMil - b.distanceMil);
				filtered = filtered.slice(0, k);
			} else if (params.searchMode === 'radius') {
				// 半径模式：过滤出指定范围内的器件
				const maxDistanceMil = params.maxDistance! * unitMultiplier;
				filtered = candidates.filter(c => c.distanceMil <= maxDistanceMil);
				filtered.sort((a, b) => a.distanceMil - b.distanceMil);
			} else if (params.searchMode === 'direction') {
				// 方向模式：按方向扇区过滤
				const directionSectors: Record<string, { start: number; end: number }> = {
					'E':  { start: 337.5, end: 22.5 },
					'NE': { start: 22.5, end: 67.5 },
					'N':  { start: 67.5, end: 112.5 },
					'NW': { start: 112.5, end: 157.5 },
					'W':  { start: 157.5, end: 202.5 },
					'SW': { start: 202.5, end: 247.5 },
					'S':  { start: 247.5, end: 292.5 },
					'SE': { start: 292.5, end: 337.5 },
				};

				const sector = directionSectors[params.direction!];
				if (sector) {
					filtered = candidates.filter(c => {
						const angle = c.angleDegrees;
						if (sector.start > sector.end) {
							return angle >= sector.start || angle < sector.end;
						} else {
							return angle >= sector.start && angle < sector.end;
						}
					});
				}

				// 同时应用距离过滤
				const maxDistanceMil = params.maxDistance! * unitMultiplier;
				filtered = filtered.filter(c => c.distanceMil <= maxDistanceMil);
				filtered.sort((a, b) => a.distanceMil - b.distanceMil);
			} else if (params.searchMode === 'collision') {
				// 干涉检测：检查间距不足的器件
				const minDistanceMil = params.minDistance! * unitMultiplier;
				filtered = candidates.filter(c => c.distanceMil < minDistanceMil);

				// 生成警告
				for (const c of filtered) {
					warnings.push({
						type: 'spacing',
						message: `${c.component.getState_Designator()} 距离参考器件仅 ${c.distanceMM.toFixed(2)}mm，小于最小间距 ${params.minDistance}`,
						severity: 'warning',
					});
				}

				filtered.sort((a, b) => a.distanceMil - b.distanceMil);
			}

			// 9. 排序
			if (params.sortBy === 'angle') {
				filtered.sort((a, b) => a.angleDegrees - b.angleDegrees);
			} else if (params.sortBy === 'designator') {
				filtered.sort((a, b) => {
					const aDesignator = a.component.getState_Designator() || '';
					const bDesignator = b.component.getState_Designator() || '';
					return aDesignator.localeCompare(bDesignator);
				});
			} else {
				// 默认按距离排序
				filtered.sort((a, b) => a.distanceMil - b.distanceMil);
			}

			// 10. 边界盒重叠检测
			const useBBox = params.useBoundingBoxOverlap !== false; // 默认 true
			const bboxType = params.boundingBoxType || 'raw';
			let referenceBoundingBox: any = null;

			if (useBBox) {
				try {
					this.logger.log(`启用边界盒重叠检测（类型: ${bboxType}）...`);

					// 10.1 计算参考器件边界盒
					const refBBoxResult = await this.calculateComponentBoundingBox({
						designator: params.referenceDesignator,
						safetyMargin: 0,
						unit: 'mil',
					});

					if (refBBoxResult.success && refBBoxResult.boundingBox) {
						referenceBoundingBox = refBBoxResult.boundingBox[bboxType];
						this.logger.log(`参考器件边界盒: ${referenceBoundingBox.width.toFixed(1)}×${referenceBoundingBox.height.toFixed(1)}mil`);
					} else {
						this.logger.warn('参考器件边界盒计算失败，跳过边界盒检测');
					}
				} catch (error) {
					this.logger.warn('边界盒计算失败，使用中心点检测:', error);
				}
			}

			// 11. 格式化输出（使用 Promise.all 支持异步边界盒计算）
			const resultsWithNulls = await Promise.all(
				filtered.map(async (c) => {
					let overlapping = false;
					let boundingBoxInfo: any = undefined;

					if (referenceBoundingBox) {
						try {
							// 计算候选器件边界盒
							const designator = c.component.getState_Designator();
							if (!designator) {
								this.logger.warn(`Component has no designator, skipping bounding box calculation`);
								return null;
							}
							const compBBoxResult = await this.calculateComponentBoundingBox({
								designator,
								safetyMargin: 0,
								unit: 'mil',
							});

							if (compBBoxResult.success && compBBoxResult.boundingBox) {
								const compBBox = compBBoxResult.boundingBox[bboxType];
								overlapping = checkBoundingBoxOverlap(referenceBoundingBox, compBBox);
								boundingBoxInfo = {
									minX: compBBox.minX,
									minY: compBBox.minY,
									maxX: compBBox.maxX,
									maxY: compBBox.maxY,
									width: compBBox.width,
									height: compBBox.height,
									type: bboxType,
								};
							}
						} catch (error) {
							this.logger.warn(`器件 ${c.component.getState_Designator()} 边界盒计算失败:`, error);
						}
					}

					return {
						designator: c.component.getState_Designator(),
						position: {
							x: c.component.getState_X(),
							y: c.component.getState_Y(),
						},
						layer: c.component.getState_Layer() as number,
						rotation: c.component.getState_Rotation(),
						distance: {
							mil: c.distanceMil,
							mm: c.distanceMM,
							inch: c.distanceInch,
						},
						angle: c.angleDegrees,
						direction: c.cardinalDirection,
						detailedDirection: c.detailedDirection,
						overlapping, // 实际检测结果（而非硬编码 false）
						...(boundingBoxInfo && { boundingBox: boundingBoxInfo }), // 可选边界盒信息
					};
				})
			);

			// 过滤掉 null 结果（无位号的器件）
			const nearbyComponents = resultsWithNulls.filter((r): r is Exclude<typeof r, null> => r !== null);

			const executionTime = Date.now() - startTime;

			// 11. 计算密度（可选）
			let density = undefined;
			if (params.searchMode === 'radius' && params.maxDistance) {
				const radiusMil = params.maxDistance * unitMultiplier;
				const areaMil2 = Math.PI * radiusMil * radiusMil;
				density = nearbyComponents.length / areaMil2;
			}

			this.logger.log(`Found ${nearbyComponents.length} nearby components in ${executionTime}ms`);

			return {
				success: true,
				reference: {
					designator: reference.getState_Designator() || params.referenceDesignator,
					position: { x: refX, y: refY },
					layer: refLayer,
				},
				nearbyComponents,
				statistics: {
					totalFound: nearbyComponents.length,
					searched: allComponents.length,
					executionTime,
					density,
				},
				warnings: warnings.length > 0 ? warnings : undefined,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('findNearbyComponents error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 检测元器件碰撞和间距违规
	 * @param params - 碰撞检测参数
	 * @returns 碰撞检测结果
	 */
	async checkComponentCollision(params: {
		referenceDesignator: string;
		checkMode: 'spacing' | 'overlap' | 'both';
		minSpacing?: number;
		boundingBoxType?: 'raw' | 'actual';
		unit?: 'mm' | 'mil' | 'inch';
		layer?: 'top' | 'bottom' | 'all';
		excludeDesignators?: string[];
		maxResults?: number;
	}): Promise<CollisionCheckResult> {
		const startTime = Date.now();
		try {
			this.logger.log('Checking component collisions:', params);

			// 参数验证
			if (params.checkMode === 'spacing' && params.minSpacing === undefined) {
				throw new Error('间距检查模式需要指定 minSpacing 参数');
			}

			// 单位转换系数
			const unitMultiplier = params.unit === 'mm' ? 0.0254 :
				params.unit === 'inch' ? 0.001 : 1; // mil

			// 1. 获取参考元器件
			const allComponents = await eda.pcb_PrimitiveComponent.getAll();
			const reference = allComponents.filter(c => c.getState_Designator() === params.referenceDesignator);
			if (!reference || reference.length === 0) {
				throw new Error(`未找到参考元器件: ${params.referenceDesignator}`);
			}
			const refComponent = reference[0];
			const refDesignator = refComponent.getState_Designator() || params.referenceDesignator;
			const refX = refComponent.getState_X() || 0;
			const refY = refComponent.getState_Y() || 0;
			const refLayer = refComponent.getState_Layer() || 1;

			this.logger.log(`Reference component: ${refDesignator} at (${refX}, ${refY}) on layer ${refLayer}`);

			// 2. 计算参考元器件边界盒（所有模式都需要）
			// 根据 boundingBoxType 设置安全裕量：actual 模式使用 50mil，raw 模式使用 0
			const safetyMargin = params.boundingBoxType === 'actual' ? 50 : 0;
			const bboxResult = await this.calculateComponentBoundingBox({
				designator: params.referenceDesignator,
				safetyMargin,
				unit: 'mil',
			});

			let refBoundingBox: { minX: number; minY: number; maxX: number; maxY: number } | undefined;
			if (bboxResult.success && bboxResult.boundingBox) {
				const bboxType = params.boundingBoxType || 'raw';
				const bbox = bboxResult.boundingBox[bboxType];
				if (bbox) {
					refBoundingBox = bbox;
					this.logger.log(`Reference bounding box (${bboxType}):`, refBoundingBox);
				}
			}

			// 3. 获取所有候选元器件
			const allComponentsResult = await this.getAllComponents();
			if (!allComponentsResult.success || !allComponentsResult.components) {
				throw new Error('无法获取元器件列表');
			}

			// 过滤层级和排除列表
			const excludeSet = new Set(params.excludeDesignators || []);
			let candidates = allComponentsResult.components.filter(c => {
				if (c.designator === params.referenceDesignator) return false;
				if (excludeSet.has(c.designator)) return false;
				if (params.layer === 'top' && c.layer !== 1) return false;
				if (params.layer === 'bottom' && c.layer !== 2) return false;
				return true;
			});

			// 限制最大结果数
			const maxResults = params.maxResults || 100;
			candidates = candidates.slice(0, maxResults);

			this.logger.log(`Checking ${candidates.length} candidate components`);

			// 4. 预计算所有候选元器件的边界盒（并行处理）
			const bboxCache = new Map<string, { minX: number; minY: number; maxX: number; maxY: number } | undefined>();
			// 边界盒预计算不再限制模式，所有模式都需要边界盒计算间距
			this.logger.log('Pre-calculating bounding boxes for all candidates...');
			const bboxPromises = candidates.map(async (candidate) => {
				const result = await this.calculateComponentBoundingBox({
					designator: candidate.designator,
					safetyMargin,
					unit: 'mil',
				});
				if (result.success && result.boundingBox) {
					const bboxType = params.boundingBoxType || 'raw';
					return [candidate.designator, result.boundingBox[bboxType]] as const;
				}
				return [candidate.designator, undefined] as const;
			});
			const bboxResults = await Promise.all(bboxPromises);
			bboxResults.forEach(([designator, bbox]) => {
				bboxCache.set(designator, bbox);
			});
			this.logger.log(`Bounding box calculation completed: ${bboxCache.size} results`);

			// 5. 执行碰撞检测
			const violations: CollisionViolation[] = [];
			const warnings: CollisionWarning[] = [];
			let spacingViolationCount = 0;
			let overlapViolationCount = 0;

			for (const candidate of candidates) {
				const candX = candidate.x;
				const candY = candidate.y;
				const candLayer = candidate.layer;

				// 计算角度和方向（保留用于结果显示）
				const dx = candX - refX;
				const dy = candY - refY;
				const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
				const direction = this.getDirectionString(angle);

				// 计算边界盒间隙
				let distanceMil = 0;
				const candBoundingBox = bboxCache.get(candidate.designator);

				if (refBoundingBox && candBoundingBox) {
					// 使用边界盒边缘间隙计算距离
					distanceMil = calculateBoundingBoxGap(refBoundingBox, candBoundingBox);
				} else {
					// 降级到中心点距离（边界盒不可用时）
					distanceMil = Math.sqrt(dx * dx + dy * dy);
					if (!refBoundingBox || !candBoundingBox) {
						this.logger.warn(`BoundingBox unavailable for ${candidate.designator}, using center distance`);
					}
				}

				const distanceMM = distanceMil * 0.0254;
				const distanceInch = distanceMil * 0.001;

				let violationType: CollisionViolationType | null = null;
				let spacingViolation: any = undefined;
				let overlapViolation: any = undefined;

				// 间距检查
				if (params.checkMode === 'spacing' || params.checkMode === 'both') {
					const minSpacingMil = (params.minSpacing || 0) / unitMultiplier;
					if (distanceMil < minSpacingMil) {
						violationType = params.checkMode === 'spacing' ? 'spacing' : 'both';
						spacingViolation = {
							actual: distanceMil * unitMultiplier,
							required: params.minSpacing || 0,
							deficit: (minSpacingMil - distanceMil) * unitMultiplier,
							unit: params.unit || 'mil',
						};
						spacingViolationCount++;
					}
				}

				// 重叠检查（使用预计算的边界盒缓存）
				if ((params.checkMode === 'overlap' || params.checkMode === 'both') && refBoundingBox) {
					const candBoundingBox = bboxCache.get(candidate.designator);

					if (candBoundingBox) {
						const isOverlapping = checkBoundingBoxOverlap(refBoundingBox, candBoundingBox);
						if (isOverlapping) {
							const overlapArea = calculateOverlapArea(refBoundingBox, candBoundingBox);
							violationType = params.checkMode === 'overlap' ? 'overlap' :
								violationType === 'spacing' ? 'both' : 'both';
							overlapViolation = {
								detected: true,
								area: overlapArea,
								boundingBox: candBoundingBox as any,
							};
							overlapViolationCount++;

							// 生成 DFM 警告
							warnings.push({
								type: 'overlap',
								message: `${candidate.designator} 与 ${refDesignator} 边界盒重叠（面积: ${overlapArea.toFixed(0)} mil²）`,
								severity: 'error',
							});
						}
					}
				}

				// 如果有违规，添加到结果列表
				if (violationType) {
					violations.push({
						designator: candidate.designator,
						position: { x: candX, y: candY },
						layer: candidate.layer,
						violationType,
						spacing: spacingViolation,
						overlap: overlapViolation,
						distance: {
							mil: distanceMil,
							mm: distanceMM,
							inch: distanceInch,
						},
						angle,
						direction,
					});

					// 生成间距警告
					if (spacingViolation) {
						warnings.push({
							type: 'spacing',
							message: `${candidate.designator} 距离 ${refDesignator} 仅 ${spacingViolation.actual.toFixed(2)}${spacingViolation.unit}，小于最小间距 ${spacingViolation.required}${spacingViolation.unit}`,
							severity: 'warning',
						});
					}
				}
			}

			const executionTime = Date.now() - startTime;

			this.logger.log(`Found ${violations.length} violations in ${executionTime}ms`);

			return {
				success: true,
				reference: {
					designator: refDesignator,
					position: { x: refX, y: refY },
					layer: refLayer,
					boundingBox: refBoundingBox ? {
						raw: refBoundingBox as any,
					} : undefined,
				},
				violations,
				statistics: {
					totalChecked: candidates.length,
					violationsFound: violations.length,
					spacingViolations: spacingViolationCount,
					overlapViolations: overlapViolationCount,
					executionTimeMs: executionTime,
				},
				warnings: warnings.length > 0 ? warnings : [],
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('checkComponentCollision error:', error);
			return {
				success: false,
				reference: {
					designator: params.referenceDesignator,
					position: { x: 0, y: 0 },
					layer: 1,
				},
				violations: [],
				statistics: {
					totalChecked: 0,
					violationsFound: 0,
					spacingViolations: 0,
					overlapViolations: 0,
					executionTimeMs: 0,
				},
				warnings: [{
					type: 'calculation',
					message: errorMessage,
					severity: 'error',
				}],
			};
		}
	}

	/**
	 * 计算元器件封装边界盒
	 */
	async calculateComponentBoundingBox(params: {
		designator: string;
		safetyMargin?: number;
		unit?: 'mm' | 'mil' | 'inch';
	}): Promise<{
		success: boolean;
		boundingBox?: ComponentBoundingBox;
		error?: string;
	}> {
		const startTime = Date.now();
		try {
			this.logger.log('Calculating component bounding box:', params);

			const safetyMargin = params.safetyMargin ?? 50; // 默认50mil

			// 1. 查找元器件
			const component = await this.findComponentByDesignatorInternal(params.designator);
			if (!component) {
				return {
					success: false,
					error: `未找到位号为 ${params.designator} 的元器件`,
				};
			}

			const primitiveId = component.getState_PrimitiveId();

			// 2. 获取元器件基本信息
			const compX = component.getState_X();
			const compY = component.getState_Y();
			const compRotation = component.getState_Rotation();
			const compLayer = component.getState_Layer() as number;

			this.logger.log(`Component origin: compX=${compX}, compY=${compY}, rotation=${compRotation}°`);

			// 3. 获取所有焊盘
			const pads = await eda.pcb_PrimitiveComponent.getAllPinsByPrimitiveId(primitiveId);

			if (!pads || pads.length === 0) {
				return {
					success: false,
					error: `元器件 ${params.designator} 没有焊盘信息`,
				};
			}

			this.logger.log(`Found ${pads.length} pads for ${params.designator}`);

			// 4. 提取焊盘几何信息
			const warnings: string[] = [];
			const padGeometries: PadGeometry[] = [];

			for (const pad of pads) {
				const padNumber = pad.getState_PadNumber();
				const padX = pad.getState_X();
				const padY = pad.getState_Y();
				const padRotation = pad.getState_Rotation() ?? 0;

				// 从API获取真实焊盘尺寸（严格模式，不使用降级逻辑）
				const padShape = pad.getState_Pad();

				if (!padShape) {
					return {
						success: false,
						error: `焊盘 ${padNumber} 无法获取形状数据，API返回undefined`,
					};
				}

				const [shapeType, ...params] = padShape;

				let width: number;
				let height: number;
				let shape: PadGeometry['shape'];

				// 根据形状类型提取尺寸（数据驱动，无降级逻辑）
				switch (shapeType) {
					case 'RECT': {
						// [type, width, height, cornerRadius]
						if (typeof params[0] !== 'number' || typeof params[1] !== 'number') {
							return {
								success: false,
								error: `焊盘 ${padNumber} (RECT) 尺寸参数无效: [${params.join(', ')}]`,
							};
						}
						width = params[0];
						height = params[1];
						shape = 'rect';
						break;
					}

					case 'ELLIPSE': {
						// [type, width, height]
						if (typeof params[0] !== 'number' || typeof params[1] !== 'number') {
							return {
								success: false,
								error: `焊盘 ${padNumber} (ELLIPSE) 尺寸参数无效: [${params.join(', ')}]`,
							};
						}
						width = params[0];
						height = params[1];
						shape = 'circle';
						break;
					}

					case 'OVAL': {
						// [type, width, height]
						if (typeof params[0] !== 'number' || typeof params[1] !== 'number') {
							return {
								success: false,
								error: `焊盘 ${padNumber} (OVAL) 尺寸参数无效: [${params.join(', ')}]`,
							};
						}
						width = params[0];
						height = params[1];
						shape = 'oval';
						break;
					}

					case 'NGON': {
						// [type, width, height]
						if (typeof params[0] !== 'number' || typeof params[1] !== 'number') {
							return {
								success: false,
								error: `焊盘 ${padNumber} (NGON) 尺寸参数无效: [${params.join(', ')}]`,
							};
						}
						width = params[0];
						height = params[1];
						shape = 'polygon';
						break;
					}

					case 'POLYGON': {
						// [type, polygonData] 或 [type, polygonData[]]
						// 复杂多边形，需要计算边界盒
						const polygonData = params[0];

						// 计算多边形边界盒的辅助函数
						const calculatePolygonBounds = (data: any): { width: number; height: number } => {
							// 提取所有数字坐标
							const extractCoords = (arr: any[]): number[] => {
								const coords: number[] = [];
								for (const item of arr) {
									if (typeof item === 'number') {
										coords.push(item);
									} else if (Array.isArray(item)) {
										coords.push(...extractCoords(item));
									}
								}
								return coords;
							};

							const coords = extractCoords(Array.isArray(data) ? data : [data]);

							if (coords.length < 4) {
								throw new Error(`多边形数据不足: ${coords.length} 个数值`);
							}

							// 假设坐标格式为 [x1, y1, x2, y2, ...]
							const xCoords = coords.filter((_, i) => i % 2 === 0);
							const yCoords = coords.filter((_, i) => i % 2 === 1);

							const minX = Math.min(...xCoords);
							const maxX = Math.max(...xCoords);
							const minY = Math.min(...yCoords);
							const maxY = Math.max(...yCoords);

							return {
								width: maxX - minX,
								height: maxY - minY,
							};
						};

						try {
							const bounds = calculatePolygonBounds(polygonData);
							width = bounds.width;
							height = bounds.height;
							shape = 'polygon';
						} catch (error) {
							return {
								success: false,
								error: `焊盘 ${padNumber} (POLYGON) 边界计算失败: ${error instanceof Error ? error.message : String(error)}`,
							};
						}
						break;
					}

					default: {
						return {
							success: false,
							error: `焊盘 ${padNumber} 未知形状类型: ${shapeType}`,
						};
					}
				}

				padGeometries.push({
					padNumber,
					primitiveId: pad.getState_PrimitiveId(),
					x: padX,
					y: padY,
					width,
					height,
					rotation: padRotation,
					shape,
				});
			}

			// 5. 计算每个焊盘的边界盒
			this.logger.log('Calculating pad bounding boxes...');
			const padBoxes = padGeometries.map(pad => calculatePadBoundingBox(pad));

			// 6. 合并所有焊盘边界盒
			// 注意：由于 pad.x/pad.y 是全局坐标（已包含元器件旋转），
			// mergedBox 也是全局坐标系的边界盒（已旋转）
			this.logger.log('Merging pad bounding boxes...');
			const mergedBox = mergeBoundingBoxes(padBoxes);

			this.logger.log(`Merged bounding box (global coords, already rotated): minX=${mergedBox.minX}, minY=${mergedBox.minY}, maxX=${mergedBox.maxX}, maxY=${mergedBox.maxY}`);

			// 7. 通过反向旋转计算未旋转的原始封装尺寸
			// 将已旋转的边界盒反向旋转，得到未旋转时的尺寸
			this.logger.log(`Calculating unrotated bounding box by reversing ${compRotation}° rotation...`);

			// 将边界盒的四个角点反向旋转（旋转中心：元器件原点）
			const cornersForUnrotated = [
				{ x: mergedBox.minX, y: mergedBox.minY },
				{ x: mergedBox.maxX, y: mergedBox.minY },
				{ x: mergedBox.maxX, y: mergedBox.maxY },
				{ x: mergedBox.minX, y: mergedBox.maxY },
			];

			const unrotatedCorners = cornersForUnrotated.map(corner => {
				// 先平移到以元器件原点为中心的坐标系
				const relX = corner.x - compX;
				const relY = corner.y - compY;
				// 反向旋转（负角度）
				const reversed = rotatePoint(relX, relY, -compRotation);
				// 平移回全局坐标系
				return {
					x: reversed.x + compX,
					y: reversed.y + compY
				};
			});

			// 计算反向旋转后的边界（即未旋转的边界）
			let unminX = Infinity, unminY = Infinity;
			let unmaxX = -Infinity, unmaxY = -Infinity;

			for (const corner of unrotatedCorners) {
				unminX = Math.min(unminX, corner.x);
				unminY = Math.min(unminY, corner.y);
				unmaxX = Math.max(unmaxX, corner.x);
				unmaxY = Math.max(unmaxY, corner.y);
			}

			const unrotatedBox = {
				minX: unminX,
				minY: unminY,
				maxX: unmaxX,
				maxY: unmaxY,
				centerX: (unminX + unmaxX) / 2,
				centerY: (unminY + unmaxY) / 2,
				width: unmaxX - unminX,
				height: unmaxY - unminY,
			};

			this.logger.log(`Unrotated bounding box: width=${unrotatedBox.width.toFixed(1)}, height=${unrotatedBox.height.toFixed(1)} mil`);

			// 8. 直接使用合并后的边界盒（已旋转的全局坐标）
			// 关键修复：mergedBox 已经是全局坐标系（已包含元器件旋转），
			// 不需要再次旋转，避免双重旋转bug
			this.logger.log(`Using merged box as raw box (global coords, already rotated ${compRotation}°)`);

			const rawBox = {
				minX: mergedBox.minX,
				minY: mergedBox.minY,
				maxX: mergedBox.maxX,
				maxY: mergedBox.maxY,
				centerX: mergedBox.centerX,
				centerY: mergedBox.centerY,
				width: mergedBox.width,
				height: mergedBox.height,
			};

			this.logger.log(`Final rawBox: centerX=${rawBox.centerX}, centerY=${rawBox.centerY}, width=${rawBox.width}, height=${rawBox.height}`);

			// 9. 应用安全裕量
			const actualBox = {
				minX: rawBox.minX - safetyMargin,
				minY: rawBox.minY - safetyMargin,
				maxX: rawBox.maxX + safetyMargin,
				maxY: rawBox.maxY + safetyMargin,
				centerX: rawBox.centerX,
				centerY: rawBox.centerY,
				width: rawBox.width + 2 * safetyMargin,
				height: rawBox.height + 2 * safetyMargin,
			};

			// 10. 单位转换
			const dimensions = {
				unrotated: {
					widthMM: unrotatedBox.width * UNIT_CONVERSION.MIL_TO_MM,
					widthMil: unrotatedBox.width,
					widthInch: unrotatedBox.width * UNIT_CONVERSION.MIL_TO_INCH,
					heightMM: unrotatedBox.height * UNIT_CONVERSION.MIL_TO_MM,
					heightMil: unrotatedBox.height,
					heightInch: unrotatedBox.height * UNIT_CONVERSION.MIL_TO_INCH,
				},
				raw: {
					widthMM: rawBox.width * UNIT_CONVERSION.MIL_TO_MM,
					widthMil: rawBox.width,
					widthInch: rawBox.width * UNIT_CONVERSION.MIL_TO_INCH,
					heightMM: rawBox.height * UNIT_CONVERSION.MIL_TO_MM,
					heightMil: rawBox.height,
					heightInch: rawBox.height * UNIT_CONVERSION.MIL_TO_INCH,
				},
				actual: {
					widthMM: actualBox.width * UNIT_CONVERSION.MIL_TO_MM,
					widthMil: actualBox.width,
					widthInch: actualBox.width * UNIT_CONVERSION.MIL_TO_INCH,
					heightMM: actualBox.height * UNIT_CONVERSION.MIL_TO_MM,
					heightMil: actualBox.height,
					heightInch: actualBox.height * UNIT_CONVERSION.MIL_TO_INCH,
				},
			};

			const executionTime = Date.now() - startTime;

			this.logger.log(`Bounding box calculated in ${executionTime}ms`);

			return {
				success: true,
				boundingBox: {
					unrotated: unrotatedBox,
					raw: rawBox,
					actual: actualBox,
					dimensions,
					component: {
						designator: component.getState_Designator() || params.designator,
						primitiveId,
						layer: compLayer,
						x: compX,
						y: compY,
						rotation: compRotation,
					},
					calculationDetails: {
						padCount: pads.length,
						safetyMarginMil: safetyMargin,
						safetyMarginMM: safetyMargin * UNIT_CONVERSION.MIL_TO_MM,
						executionTimeMs: executionTime,
						warnings: warnings.length > 0 ? warnings : undefined,
					},
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('calculateComponentBoundingBox error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}

// ==================== 边界盒计算辅助函数 ====================

/**
 * 单位转换常量（精确值）
 */
const UNIT_CONVERSION = {
	MIL_TO_MM: 0.0254,        // 1 mil = 0.0254 mm
	MIL_TO_INCH: 0.001,       // 1 mil = 0.001 inch
	MM_TO_MIL: 39.3700787,    // 1 mm = 39.37 mil
	INCH_TO_MIL: 1000,        // 1 inch = 1000 mil
} as const;

/**
 * 旋转变换（绕原点旋转）
 * @param x - 原始X坐标
 * @param y - 原始Y坐标
 * @param angleDegrees - 旋转角度（度）
 * @returns 旋转后的坐标
 */
function rotatePoint(
	x: number,
	y: number,
	angleDegrees: number
): { x: number; y: number } {
	const angleRadians = angleDegrees * (Math.PI / 180);
	const cos = Math.cos(angleRadians);
	const sin = Math.sin(angleRadians);

	return {
		x: x * cos - y * sin,
		y: x * sin + y * cos,
	};
}

/**
 * 计算单个焊盘的边界盒（考虑旋转）
 * @param pad - 焊盘几何信息
 * @returns 焊盘边界盒
 */
function calculatePadBoundingBox(pad: PadGeometry): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
} {
	// 焊盘的四个角点（相对于焊盘中心）
	const halfW = pad.width / 2;
	const halfH = pad.height / 2;

	const corners = [
		{ x: -halfW, y: -halfH },
		{ x: halfW, y: -halfH },
		{ x: halfW, y: halfH },
		{ x: -halfW, y: halfH },
	];

	// 应用旋转
	const rotatedCorners = corners.map(corner =>
		rotatePoint(corner.x, corner.y, pad.rotation)
	);

	// 计算旋转后的边界
	let minX = Infinity, minY = Infinity;
	let maxX = -Infinity, maxY = -Infinity;

	for (const corner of rotatedCorners) {
		minX = Math.min(minX, corner.x);
		minY = Math.min(minY, corner.y);
		maxX = Math.max(maxX, corner.x);
		maxY = Math.max(maxY, corner.y);
	}

	// 加上焊盘位置偏移
	return {
		minX: minX + pad.x,
		minY: minY + pad.y,
		maxX: maxX + pad.x,
		maxY: maxY + pad.y,
	};
}

/**
 * 合并多个边界盒为一个总边界盒
 * @param boxes - 边界盒数组
 * @returns 合并后的边界盒
 */
function mergeBoundingBoxes(boxes: Array<{
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}>): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
	centerX: number;
	centerY: number;
} {
	let minX = Infinity, minY = Infinity;
	let maxX = -Infinity, maxY = -Infinity;

	for (const box of boxes) {
		minX = Math.min(minX, box.minX);
		minY = Math.min(minY, box.minY);
		maxX = Math.max(maxX, box.maxX);
		maxY = Math.max(maxY, box.maxY);
	}

	const width = maxX - minX;
	const height = maxY - minY;
	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;

	return { minX, minY, maxX, maxY, width, height, centerX, centerY };
}

// ==================== 边界盒重叠检测辅助函数 ====================

/**
 * 检查两个轴对齐边界盒是否重叠（AABB算法）
 * @param box1 - 第一个边界盒
 * @param box2 - 第二个边界盒
 * @returns 是否重叠
 *
 * 使用AABB（Axis-Aligned Bounding Box）分离定理：
 * 如果任一维度上分离，则两个盒不重叠
 */
function checkBoundingBoxOverlap(
	box1: { minX: number; minY: number; maxX: number; maxY: number },
	box2: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
	// 不重叠条件（任一成立即不重叠）
	const noOverlap =
		box1.maxX < box2.minX || // box1 完全在 box2 左侧
		box1.minX > box2.maxX || // box1 完全在 box2 右侧
		box1.maxY < box2.minY || // box1 完全在 box2 上方
		box1.minY > box2.maxY;   // box1 完全在 box2 下方

	// 重叠 = 不重叠条件的否定
	return !noOverlap;
}

/**
 * 计算两个边界盒的重叠面积
 * @param box1 - 第一个边界盒
 * @param box2 - 第二个边界盒
 * @returns 重叠面积（平方 mil），如果不重叠则返回 0
 */
function calculateOverlapArea(
	box1: { minX: number; minY: number; maxX: number; maxY: number },
	box2: { minX: number; minY: number; maxX: number; maxY: number }
): number {
	// 如果不重叠，直接返回 0
	if (!checkBoundingBoxOverlap(box1, box2)) {
		return 0;
	}

	// 计算重叠区域的边界
	const overlapMinX = Math.max(box1.minX, box2.minX);
	const overlapMinY = Math.max(box1.minY, box2.minY);
	const overlapMaxX = Math.min(box1.maxX, box2.maxX);
	const overlapMaxY = Math.min(box1.maxY, box2.maxY);

	// 计算重叠面积
	const overlapWidth = overlapMaxX - overlapMinX;
	const overlapHeight = overlapMaxY - overlapMinY;

	return overlapWidth * overlapHeight;
}

/**
 * 计算两个边界盒之间的边缘间隙
 * @param box1 - 第一个边界盒
 * @param box2 - 第二个边界盒
 * @returns 边缘间隙距离（重叠时返回 0）
 *
 * 计算两个边界盒最近边缘之间的最短距离：
 * - 如果边界盒重叠，返回 0
 * - 否则返回 X 轴和 Y 轴间隙的欧几里得距离
 */
function calculateBoundingBoxGap(
	box1: { minX: number; minY: number; maxX: number; maxY: number },
	box2: { minX: number; minY: number; maxX: number; maxY: number }
): number {
	// 如果边界盒重叠，间隙为 0
	if (checkBoundingBoxOverlap(box1, box2)) {
		return 0;
	}

	// 计算X轴上的间隙（正值表示分离）
	const gapX = Math.max(box1.minX - box2.maxX, box2.minX - box1.maxX, 0);

	// 计算Y轴上的间隙（正值表示分离）
	const gapY = Math.max(box1.minY - box2.maxY, box2.minY - box1.maxY, 0);

	// 返回边缘间隙（欧几里得距离）
	return Math.sqrt(gapX * gapX + gapY * gapY);
}
