/**
 * 元器件变换适配器
 */

import { BasePCBAdapter } from '../base/base-pcb-adapter';
import type { ComponentInfo } from '../../types/pcb-types';

export class ComponentTransformAdapter extends BasePCBAdapter {
	constructor() {
		super('ComponentTransform');
	}

	async setComponentTransform(params: {
		designator: string;
		x?: number;
		y?: number;
		rotation?: number;
		layer?: number;
	}): Promise<{
		success: boolean;
		component?: ComponentInfo;
		error?: string;
	}> {
		try {
			this.logger.log('Setting component transform:', params);

			if (params.x === undefined && params.y === undefined &&
				params.rotation === undefined && params.layer === undefined) {
				return {
					success: false,
					error: '必须至少提供 x、y、rotation 或 layer 参数之一',
				};
			}

			if (params.layer !== undefined && params.layer !== 1 && params.layer !== 2) {
				return {
					success: false,
					error: 'layer 参数必须为 1 (TOP) 或 2 (BOTTOM)',
				};
			}

			const targetComponent = await this.findComponentByDesignatorInternal(params.designator);

			if (!targetComponent) {
				return {
					success: false,
					error: `未找到位号为 ${params.designator} 的元器件`,
				};
			}

			const primitiveId = targetComponent.getState_PrimitiveId();

			const modifyParams: { x?: number; y?: number; rotation?: number; layer?: number } = {};
			if (params.x !== undefined) modifyParams.x = params.x;
			if (params.y !== undefined) modifyParams.y = params.y;
			if (params.rotation !== undefined) modifyParams.rotation = params.rotation;
			if (params.layer !== undefined) modifyParams.layer = params.layer;

			await eda.pcb_PrimitiveComponent.modify(primitiveId, modifyParams);

			const allComponentsAfter = await eda.pcb_PrimitiveComponent.getAll();
			const updatedComponent = allComponentsAfter.find(comp => {
				return comp.getState_PrimitiveId() === primitiveId;
			});

			if (!updatedComponent) {
				return {
					success: false,
					error: `修改后无法获取元器件 ${params.designator}`,
				};
			}

			this.logger.log(`Component ${params.designator} transform updated successfully`);

			return {
				success: true,
				component: {
					designator: updatedComponent.getState_Designator() || params.designator,
					primitiveId: updatedComponent.getState_PrimitiveId() || primitiveId,
					x: updatedComponent.getState_X(),
					y: updatedComponent.getState_Y(),
					rotation: updatedComponent.getState_Rotation(),
					layer: updatedComponent.getState_Layer(),
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('setComponentTransform error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}
