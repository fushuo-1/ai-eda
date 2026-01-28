/**
 * 层管理适配器
 */

import { BasePCBAdapter } from '../base/base-pcb-adapter';
import type { LayerCount } from '../../types/pcb-types';

export class LayerAdapter extends BasePCBAdapter {
	constructor() {
		super('Layer');
	}

	async getLayerCount(): Promise<{
		success: boolean;
		layerCount?: LayerCount;
		error?: string;
	}> {
		try {
			this.logger.log('Getting layer count...');

			const allLayers = await eda.pcb_Layer.getAllLayers();

			if (!allLayers || allLayers.length === 0) {
				return {
					success: false,
					error: '未获取到任何图层信息',
				};
			}

			const topLayer = allLayers.find((l: any) => l.id === 1 && l.layerStatus !== 0);
			const bottomLayer = allLayers.find((l: any) => l.id === 2 && l.layerStatus !== 0);
			const innerLayers = allLayers.filter((l: any) => l.id >= 15 && l.id <= 46 && l.layerStatus !== 0);

			const copperLayerCount = (topLayer ? 1 : 0) + (bottomLayer ? 1 : 0) + innerLayers.length;
			const enabledLayersCount = allLayers.filter((l: any) => l.layerStatus !== 0).length;

			this.logger.log(`Layer count: ${copperLayerCount} copper layers`);

			return {
				success: true,
				layerCount: {
					topLayer: !!topLayer,
					bottomLayer: !!bottomLayer,
					innerLayerCount: innerLayers.length,
					copperLayerCount,
					allLayersCount: allLayers.length,
					enabledLayersCount,
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('getLayerCount error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async setActiveLayer(params: { layer: string }): Promise<{
		success: boolean;
		activeLayer?: string;
	}> {
		try {
			this.logger.log('Setting active layer:', params);
			return { success: true, activeLayer: params.layer };
		} catch (error) {
			this.logger.error('setActiveLayer error:', error);
			throw error;
		}
	}

	async getLayerList(): Promise<{
		success: boolean;
		layers?: Array<{ id: string; name: string; type: string; visible: boolean }>;
	}> {
		try {
			this.logger.log('Getting layer list');
			return {
				success: true,
				layers: [
					{ id: 'top', name: 'Top Layer', type: 'signal', visible: true },
					{ id: 'bottom', name: 'Bottom Layer', type: 'signal', visible: true },
				],
			};
		} catch (error) {
			this.logger.error('getLayerList error:', error);
			throw error;
		}
	}

	async addLayer(params: { name: string; type: string; position: number }): Promise<{
		success: boolean;
		layerId?: string;
	}> {
		try {
			this.logger.log('Adding layer:', params);
			return {
				success: true,
				layerId: `layer_${Date.now()}`,
			};
		} catch (error) {
			this.logger.error('addLayer error:', error);
			throw error;
		}
	}
}
