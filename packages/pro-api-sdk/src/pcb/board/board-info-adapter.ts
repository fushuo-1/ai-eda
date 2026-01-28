/**
 * 板框信息适配器
 */

import { BasePCBAdapter } from '../base/base-pcb-adapter';
import type { BoardOutlineSize, BoardOutlinePosition, Vertex } from '../../types/pcb-types';

export class BoardInfoAdapter extends BasePCBAdapter {
	constructor() {
		super('BoardInfo');
	}

	async getBoardOutlineSize(
		params: { unit?: 'mm' | 'mil' | 'inch' } = {}
	): Promise<{
		success: boolean;
		boardOutline?: BoardOutlineSize;
		error?: string;
	}> {
		try {
			this.logger.log('Getting board outline size:', params);

			const boardOutlines = await eda.pcb_PrimitivePolyline.getAll(
				undefined,
				11,
				undefined
			);

			if (!boardOutlines || boardOutlines.length === 0) {
				return {
					success: false,
					error: '未找到板框。请确保 PCB 已绘制板框且位于 Board Outline 层（Layer 11）',
				};
			}

			this.logger.log(`Found ${boardOutlines.length} board outline(s)`);

			const firstOutline = boardOutlines[0];
			const primitiveId = firstOutline.getState_PrimitiveId();
			const layer = firstOutline.getState_Layer();

			const polygon = firstOutline.getState_Polygon();
			const complexPolygon = polygon.getSource();

			const widthMil = eda.pcb_MathPolygon.calculateBBoxWidth(complexPolygon);
			const heightMil = eda.pcb_MathPolygon.calculateBBoxHeight(complexPolygon);

			const widthMM = widthMil * 0.0254;
			const heightMM = heightMil * 0.0254;
			const widthInch = widthMil / 1000;
			const heightInch = heightMil / 1000;

			return {
				success: true,
				boardOutline: {
					widthMM,
					heightMM,
					widthMil,
					heightMil,
					widthInch,
					heightInch,
					layer,
					primitiveId,
					outlineCount: boardOutlines.length,
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('getBoardOutlineSize error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async getBoardOutlinePosition(): Promise<{
		success: boolean;
		boardOutline?: BoardOutlinePosition;
		error?: string;
	}> {
		try {
			this.logger.log('Getting board outline position...');

			const boardOutlines = await eda.pcb_PrimitivePolyline.getAll(
				undefined,
				11,
				undefined
			);

			if (!boardOutlines || boardOutlines.length === 0) {
				return {
					success: false,
					error: '未找到板框',
				};
			}

			const firstOutline = boardOutlines[0];
			const primitiveId = firstOutline.getState_PrimitiveId();
			const layer = firstOutline.getState_Layer();

			const polygon = firstOutline.getState_Polygon();
			const complexPolygon = polygon.getSource();

			const vertices: Vertex[] = [];
			let minX = Infinity, minY = Infinity;
			let maxX = -Infinity, maxY = -Infinity;

			for (let i = 0; i < complexPolygon.length; i++) {
				const item = complexPolygon[i];

				if (typeof item === 'string') {
					continue;
				} else if (typeof item === 'number') {
					if (i + 1 < complexPolygon.length && typeof complexPolygon[i + 1] === 'number') {
						const x = item;
						const y = complexPolygon[i + 1] as number;

						let type = 'L';
						for (let j = i - 1; j >= 0; j--) {
							if (typeof complexPolygon[j] === 'string') {
								type = complexPolygon[j] as string;
								break;
							}
						}

						vertices.push({ x, y, type });

						minX = Math.min(minX, x);
						minY = Math.min(minY, y);
						maxX = Math.max(maxX, x);
						maxY = Math.max(maxY, y);

						i++;
					}
				}
			}

			const centerX = (minX + maxX) / 2;
			const centerY = (minY + maxY) / 2;
			const width = maxX - minX;
			const height = maxY - minY;

			return {
				success: true,
				boardOutline: {
					primitiveId,
					layer,
					boundingBox: {
						minX,
						minY,
						maxX,
						maxY,
						centerX,
						centerY,
						width,
						height,
					},
					vertices,
					outlineCount: boardOutlines.length,
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('getBoardOutlinePosition error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}
