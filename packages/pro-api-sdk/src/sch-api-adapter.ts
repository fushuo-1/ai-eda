/**
 * SCH (原理图) API 适配器
 *
 * 将 MCP 请求转换为嘉立创EDA原理图 API 调用
 */

import type {
	SCHComponentInfo,
	SCHComponentType,
	SCHPinInfo,
	SCHGetAllComponentsParams,
	SCHGetComponentByDesignatorParams,
	SCHGetComponentPinsParams,
	SCHGetAllComponentsResult,
	SCHGetComponentByDesignatorResult,
	SCHGetComponentPinsResult,
} from './protocol.js';

/**
 * 原理图 API 适配器类
 */
export class SCHApiAdapter {
	/**
	 * 获取所有元器件
	 *
	 * @param params - 参数对象
	 * @returns 元器件信息列表
	 */
	async getAllComponents(
		params: SCHGetAllComponentsParams = {}
	): Promise<SCHGetAllComponentsResult> {
		try {
			console.log('[SCH API] Getting all components:', params);

			// 转换组件类型为嘉立创EDA枚举值
			const componentType = this.mapComponentType(params.componentType);

			// 调用嘉立创EDA API
			const components = await eda.sch_PrimitiveComponent.getAll(
				componentType,
				params.allSchematicPages ?? false
			);

			if (!components) {
				return {
					success: false,
					components: [],
					count: 0,
					error: 'Failed to retrieve components from API',
				};
			}

			// 转换为简化的元器件信息
			const componentInfos: SCHComponentInfo[] = components.map((comp) =>
				this.convertComponentToInfo(comp)
			);

			console.log(`[SCH API] Found ${componentInfos.length} components`);

			return {
				success: true,
				components: componentInfos,
				count: componentInfos.length,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[SCH API] getAllComponents error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 根据位号获取元器件
	 *
	 * @param params - 包含位号的参数对象
	 * @returns 元器件信息
	 */
	async getComponentByDesignator(
		params: SCHGetComponentByDesignatorParams
	): Promise<SCHGetComponentByDesignatorResult> {
		try {
			console.log('[SCH API] Getting component by designator:', params);

			const { designator } = params;

			if (!designator) {
				return {
					success: false,
					error: 'Designator is required',
				};
			}

			// 获取所有元器件（不指定类型过滤）
			const allComponents = await eda.sch_PrimitiveComponent.getAll();

			if (!allComponents) {
				return {
					success: false,
					error: 'Failed to retrieve components from API',
				};
			}

			// 查找匹配的元器件
			const component = allComponents.find(
				(comp) => comp.getState_Designator() === designator
			);

			if (!component) {
				return {
					success: false,
					error: `Component with designator "${designator}" not found`,
				};
			}

			const componentInfo = this.convertComponentToInfo(component);

			console.log('[SCH API] Found component:', componentInfo.designator);

			return {
				success: true,
				component: componentInfo,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[SCH API] getComponentByDesignator error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 获取元器件引脚
	 *
	 * @param params - 包含元器件ID的参数对象
	 * @returns 引脚信息列表
	 */
	async getComponentPins(
		params: SCHGetComponentPinsParams
	): Promise<SCHGetComponentPinsResult> {
		try {
			console.log('[SCH API] Getting component pins:', params);

			const { primitiveId } = params;

			if (!primitiveId) {
				return {
					success: false,
					error: 'Primitive ID is required',
				};
			}

			// 调用嘉立创EDA API获取引脚
			const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(
				primitiveId
			);

			if (!pins) {
				return {
					success: false,
					error: `Failed to retrieve pins for component "${primitiveId}"`,
				};
			}

			// 转换为引脚信息
			const pinInfos: SCHPinInfo[] = pins.map((pin) => ({
				primitiveId: pin.getState_PrimitiveId(),
				pinNumber: pin.getState_PinNumber(),
				pinName: pin.getState_PinName(),
				net: undefined, // 引脚对象没有直接的net属性，需要通过网络分析获取
				position: {
					x: pin.getState_X(),
					y: pin.getState_Y(),
				},
				rotation: pin.getState_Rotation(),
			}));

			console.log(`[SCH API] Found ${pinInfos.length} pins`);

			return {
				success: true,
				pins: pinInfos,
				count: pinInfos.length,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[SCH API] getComponentPins error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 将嘉立创EDA组件对象转换为简化的信息对象
	 *
	 * @param component - 嘉立创EDA组件对象
	 * @returns 简化的组件信息
	 */
	private convertComponentToInfo(component: any): SCHComponentInfo {
		// 获取组件类型
		const typeEnum = component.getState_ComponentType();
		const componentType = this.mapComponentTypeEnumToString(typeEnum);

		return {
			primitiveId: component.getState_PrimitiveId(),
			designator: component.getState_Designator() || '',
			name: component.getState_Name() || '',
			type: componentType,
			position: {
				x: component.getState_X(),
				y: component.getState_Y(),
			},
			rotation: component.getState_Rotation(),
			mirror: component.getState_Mirror(),
			addIntoBom: component.getState_AddIntoBom() ?? false,
			addIntoPcb: component.getState_AddIntoPcb() ?? false,
			manufacturer: component.manufacturer || '',
			supplier: component.supplier || '',
			supplierId: component.supplierId || '',
			net: component.net || '',
			uniqueId: component.uniqueId || '',
		};
	}

	/**
	 * 将字符串类型映射到嘉立创EDA枚举值
	 *
	 * @param type - 组件类型字符串
	 * @returns 嘉立创EDA枚举值或undefined
	 */
	private mapComponentType(type?: string): any {
		if (!type) {
			return undefined;
		}

		// 映射到嘉立创EDA的枚举值
		const typeMap: Record<string, any> = {
			COMPONENT: 'part',
			DRAWING: 'sheet',
			NET_FLAG: 'net flag',
			NET_PORT: 'net port',
			NET_LABEL: 'net label',
			NON_ELECTRICAL_FLAG: 'no electrical flag',
			SHORT_CIRCUIT_FLAG: 'short circuit flag',
		};

		return typeMap[type];
	}

	/**
	 * 将嘉立创EDA枚举值转换为字符串
	 *
	 * @param typeEnum - 嘉立创EDA枚举值
	 * @returns 组件类型字符串
	 */
	private mapComponentTypeEnumToString(typeEnum: any): SCHComponentType {
		// 嘉立创EDA的枚举值是字符串类型，直接返回
		if (typeof typeEnum === 'string') {
			const enumMap: Record<string, SCHComponentType> = {
				part: 'COMPONENT',
				sheet: 'DRAWING',
				'net flag': 'NET_FLAG',
				'net port': 'NET_PORT',
				'net label': 'NET_LABEL',
				'no electrical flag': 'NON_ELECTRICAL_FLAG',
				'short circuit flag': 'SHORT_CIRCUIT_FLAG',
			};

			return enumMap[typeEnum] || 'COMPONENT';
		}

		return 'COMPONENT';
	}
}
