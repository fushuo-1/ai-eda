/**
 * 网表适配器
 */

import { BasePCBAdapter } from '../base/base-pcb-adapter';
import type { NetPin, NetlistStats, TopNet } from '../../types/pcb-types';

export class NetlistAdapter extends BasePCBAdapter {
	constructor() {
		super('Netlist');
	}

	async generateNetlistMap(): Promise<{
		success: boolean;
		netToPinsMap?: Record<string, NetPin[]>;
		componentToNetsMap?: Record<string, string[]>;
		stats?: NetlistStats;
		topNets?: TopNet[];
		error?: string;
	}> {
		try {
			this.logger.log('Generating netlist map...');

			const allComponents = await eda.pcb_PrimitiveComponent.getAll();

			if (!allComponents || allComponents.length === 0) {
				return {
					success: false,
					error: '未找到任何元器件',
				};
			}

			this.logger.log(`Found ${allComponents.length} components`);

			const netToPinsMap: Record<string, NetPin[]> = {};
			const componentToNetsMap: Record<string, Set<string>> = {};
			let processedCount = 0;

			for (const component of allComponents) {
				const designator = component.getState_Designator();
				const primitiveId = component.getState_PrimitiveId();

				// 跳过没有位号的元器件
				if (!designator) {
					continue;
				}

				try {
					const pads = await eda.pcb_PrimitiveComponent.getAllPinsByPrimitiveId(primitiveId);

					if (!pads || pads.length === 0) {
						continue;
					}

					componentToNetsMap[designator] = new Set();

					for (const pad of pads) {
						try {
							const padNumber = pad.getState_PadNumber();
							const net = pad.getState_Net();
							const x = pad.getState_X();
							const y = pad.getState_Y();

							if (net && net !== '' && net !== undefined) {
								if (!netToPinsMap[net]) {
									netToPinsMap[net] = [];
								}

								netToPinsMap[net].push({
									designator,
									padNumber,
									x,
									y
								});

								componentToNetsMap[designator].add(net);
							}
						} catch (e) {
							this.logger.warn(`${designator}: Failed to get pad info - ${(e as Error).message}`);
						}
					}

					processedCount++;

					if (processedCount % 50 === 0) {
						this.logger.log(`Progress: ${processedCount}/${allComponents.length} components processed`);
					}

				} catch (e) {
					this.logger.warn(`${designator}: Failed to process - ${(e as Error).message}`);
				}
			}

			this.logger.log(`Processed ${processedCount} components successfully`);

			const totalNets = Object.keys(netToPinsMap).length;
			const totalConnections = Object.values(netToPinsMap).reduce((sum, pins) => sum + pins.length, 0);

			const sortedNets = Object.entries(netToPinsMap)
				.sort((a, b) => b[1].length - a[1].length)
				.slice(0, 10)
				.map(([net, pins]) => ({ net, pinCount: pins.length }));

			const componentToNetsMapArray: Record<string, string[]> = {};
			for (const [designator, nets] of Object.entries(componentToNetsMap)) {
				componentToNetsMapArray[designator] = Array.from(nets).sort();
			}

			this.logger.log(`Netlist map generated: ${totalNets} nets, ${totalConnections} connections`);

			return {
				success: true,
				netToPinsMap,
				componentToNetsMap: componentToNetsMapArray,
				stats: {
					totalNets,
					totalConnections,
					totalComponents: processedCount,
					avgPinsPerNet: totalConnections / totalNets,
				},
				topNets: sortedNets,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.logger.error('generateNetlistMap error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}
