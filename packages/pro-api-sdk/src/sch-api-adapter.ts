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
	SCHGetNetlistParams,
	SCHGetNetlistResult,
	SCHGetBomParams,
	SCHGetBomResult,
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

	/**
	 * 获取原理图网表（仅支持 Allegro 格式）
	 *
	 * @param params - 参数对象
	 * @returns 网表信息
	 */
	async getNetlist(
		params: SCHGetNetlistParams = {}
	): Promise<SCHGetNetlistResult> {
		try {
			console.log('[SCH API] Getting schematic netlist:', params);

			// 调用嘉立创EDA API获取网表
			const netlistString = await eda.sch_Netlist.getNetlist('Allegro');

			if (!netlistString) {
				return {
					success: false,
					error: 'Failed to retrieve netlist from API',
				};
			}

			console.log(`[SCH API] Netlist retrieved, length: ${netlistString.length}`);

			// 解析网表
			const { components, nets } = this.parseAllegroNetlist(netlistString);

			// 创建引脚到网络映射
			const pinToNetworkMap: Record<string, string> = {};
			nets.forEach((net) => {
				net.pins.forEach((pin) => {
					const key = `${pin.designator}-${pin.pin}`;
					pinToNetworkMap[key] = net.name;
				});
			});

			const totalConnections = nets.reduce((sum, net) => sum + net.pins.length, 0);

			const stats = {
				totalComponents: components.length,
				totalNets: nets.length,
				totalConnections,
			};

			console.log(
				`[SCH API] Netlist parsed: ${stats.totalComponents} components, ${stats.totalNets} nets, ${stats.totalConnections} connections`
			);

			return {
				success: true,
				components,
				nets,
				pinToNetworkMap,
				stats,
				rawNetlist: params.includeRaw ? netlistString : undefined,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[SCH API] getNetlist error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 解析 Allegro 格式网表
	 *
	 * @param netlist - 网表字符串
	 * @returns 解析后的元器件和网络列表
	 */
	private parseAllegroNetlist(netlist: string): {
		components: Array<{ designator: string; footprint: string; value: string }>;
		nets: Array<{ name: string; pins: Array<{ designator: string; pin: string }> }>;
	} {
		const lines = netlist.split('\n').filter((l) => l.trim());
		const components: Array<{ designator: string; footprint: string; value: string }> = [];
		const nets: Array<{ name: string; pins: Array<{ designator: string; pin: string }> }> = [];

		let section = '';
		let currentNet: { name: string; pins: Array<{ designator: string; pin: string }> } | null = null;

		for (const line of lines) {
			const trimmed = line.trim();

			if (trimmed === '$PACKAGES') {
				section = 'PACKAGES';
				continue;
			}

			if (trimmed === '$A_PROPERTIES') {
				section = 'PROPERTIES';
				continue;
			}

			if (trimmed === '$NETS') {
				section = 'NETS';
				continue;
			}

			if (trimmed.startsWith('$') && !trimmed.startsWith('$1N')) {
				continue;
			}

			if (trimmed === '$END') {
				break;
			}

			if (!trimmed) continue;

			const semicolonIdx = trimmed.indexOf(';');
			if (semicolonIdx === -1) continue;

			if (section === 'PACKAGES') {
				const leftPart = trimmed.substring(0, semicolonIdx).trim();
				const rightPart = trimmed.substring(semicolonIdx + 1).trim();

				const designators = rightPart.split(/[\s,]+/).filter((d) => d && d !== ',');
				const parts = leftPart.split('!');
				const footprint = parts[0]?.trim() || '';
				const value = parts[2]?.trim() || '';

				designators.forEach((designator) => {
					if (designator) {
						components.push({ designator, footprint, value });
					}
				});
			}

			if (section === 'NETS') {
				let netName = trimmed.substring(0, semicolonIdx).trim();
				const pinsStr = trimmed.substring(semicolonIdx + 1).trim();

				// 去除网络名两端的单引号
				if (netName.startsWith("'") && netName.endsWith("'")) {
					netName = netName.slice(1, -1);
				}

				currentNet = { name: netName, pins: [] };
				nets.push(currentNet);

				const pins = pinsStr.split(/[\s,]+/).filter((p) => p && p !== ',');
				pins.forEach((pin) => {
					const match = pin.match(/^([A-Z0-9]+)\.(\d+)$/);
					if (match) {
						currentNet!.pins.push({ designator: match[1], pin: match[2] });
					}
				});
			}
		}

		return { components, nets };
	}

	/**
	 * 获取原理图 BOM
	 *
	 * @param params - 参数对象
	 * @returns BOM 信息
	 */
	async getBom(params: SCHGetBomParams = {}): Promise<SCHGetBomResult> {
		try {
			console.log('[SCH API] Getting schematic BOM:', params);

			const groupByValue = params.groupByValue !== false;
			const includeNonBom = params.includeNonBom === true;

			// 获取所有组件
			const allComponents = await eda.sch_PrimitiveComponent.getAll();

			if (!allComponents) {
				return {
					success: false,
					error: 'Failed to retrieve components from API',
				};
			}

			console.log(`[SCH API] Found ${allComponents.length} components`);

			// 转换为 BOM 组件列表
			const bomComponents = allComponents
				.filter((comp) => includeNonBom || comp.getState_AddIntoBom())
				.map((comp) => ({
					designator: comp.getState_Designator() || '',
					value: comp.getState_Name() || '',
					footprint: '',
					manufacturer: comp.manufacturer || '',
					supplier: comp.supplier || '',
					supplierId: comp.supplierId || '',
					addIntoBom: comp.getState_AddIntoBom() ?? false,
					addIntoPcb: comp.getState_AddIntoPcb() ?? false,
				}));

			console.log(`[SCH API] Filtered to ${bomComponents.length} BOM components`);

			// 计算统计信息
			const bomComponentCount = bomComponents.filter((c) => c.addIntoBom).length;
			const nonBomComponentCount = bomComponents.filter((c) => !c.addIntoBom).length;

			let groupedEntries: Array<{
				value: string;
				footprint: string;
				designators: string[];
				count: number;
				manufacturer?: string;
				supplier?: string;
				supplierId?: string;
			}> = [];

			if (groupByValue) {
				// 按 value 和 footprint 分组
				const groupMap = new Map<
					string,
					{
						value: string;
						footprint: string;
						designators: string[];
						manufacturer?: string;
						supplier?: string;
						supplierId?: string;
					}
				>();

				for (const comp of bomComponents) {
					const key = `${comp.value}|${comp.footprint}`;

					if (!groupMap.has(key)) {
						groupMap.set(key, {
							value: comp.value,
							footprint: comp.footprint,
							designators: [],
							manufacturer: comp.manufacturer,
							supplier: comp.supplier,
							supplierId: comp.supplierId,
						});
					}

					const entry = groupMap.get(key)!;
					entry.designators.push(comp.designator);
				}

				groupedEntries = Array.from(groupMap.values())
					.map((entry) => ({
						...entry,
						count: entry.designators.length,
					}))
					.sort((a, b) => a.designators[0].localeCompare(b.designators[0]));
			}

			const stats = {
				totalComponents: bomComponents.length,
				bomComponents: bomComponentCount,
				nonBomComponents: nonBomComponentCount,
				uniquePartNumbers: groupedEntries.length,
			};

			console.log(
				`[SCH API] BOM generated: ${stats.bomComponents} BOM items, ${stats.uniquePartNumbers} unique parts`
			);

			return {
				success: true,
				components: bomComponents,
				grouped: groupByValue ? groupedEntries : undefined,
				stats,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[SCH API] getBom error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}
