/**
 * PCB API 基类
 *
 * 提供所有 PCB 适配器的公共功能
 */

import { PCBLogger } from './logger';
import type { ComponentInfo } from '../../types/pcb-types';

/**
 * PCB API 适配器基类
 */
export abstract class BasePCBAdapter {
	protected logger: PCBLogger;

	constructor(moduleName: string) {
		this.logger = new PCBLogger(moduleName);
	}

	/**
	 * 获取当前 PCB 文档
	 */
	protected getPCBDocument() {
		return eda.pcb_Document;
	}

	/**
	 * 按位号查找元器件（内部方法）
	 */
	protected async findComponentByDesignatorInternal(
		designator: string
	): Promise<any> {
		const allComponents = await eda.pcb_PrimitiveComponent.getAll();
		const target = allComponents.find(
			comp => comp.getState_Designator() === designator
		);
		if (!target) {
			throw new Error(`未找到位号为 ${designator} 的元器件`);
		}
		return target;
	}

	/**
	 * 映射元器件列表为标准格式
	 */
	protected mapComponentList(components: any[]): ComponentInfo[] {
		return components.map(comp => ({
			designator: comp.getState_Designator() || '',
			primitiveId: comp.getState_PrimitiveId(),
			layer: comp.getState_Layer() as number,
			x: comp.getState_X(),
			y: comp.getState_Y(),
			rotation: comp.getState_Rotation(),
		}));
	}
}
