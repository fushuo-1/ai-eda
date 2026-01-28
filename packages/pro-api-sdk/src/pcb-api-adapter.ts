/**
 * PCB API 适配器
 *
 * 主门面类，将所有方法委托给专门的适配器
 */

import { BoardInfoAdapter } from './pcb/board/board-info-adapter';
import { LayerAdapter } from './pcb/board/layer-adapter';
import { ComponentQueryAdapter } from './pcb/component/component-query-adapter';
import { ComponentTransformAdapter } from './pcb/component/component-transform-adapter';
import { ComponentPlacementAdapter } from './pcb/component/component-placement-adapter';
import { NetlistAdapter } from './pcb/netlist/netlist-adapter';
import { RoutingAdapter } from './pcb/routing/routing-adapter';
import { DRCAdapter } from './pcb/drc/drc-adapter';
import { ProjectAdapter } from './pcb/project/project-adapter';

/**
 * PCB API 适配器类
 */
export class PCBApiAdapter {
	private boardInfo: BoardInfoAdapter;
	private layer: LayerAdapter;
	private componentQuery: ComponentQueryAdapter;
	private componentTransform: ComponentTransformAdapter;
	private componentPlacement: ComponentPlacementAdapter;
	private netlist: NetlistAdapter;
	private routing: RoutingAdapter;
	private drc: DRCAdapter;
	private project: ProjectAdapter;

	constructor() {
		this.boardInfo = new BoardInfoAdapter();
		this.layer = new LayerAdapter();
		this.componentQuery = new ComponentQueryAdapter();
		this.componentTransform = new ComponentTransformAdapter();
		this.componentPlacement = new ComponentPlacementAdapter();
		this.netlist = new NetlistAdapter();
		this.routing = new RoutingAdapter();
		this.drc = new DRCAdapter();
		this.project = new ProjectAdapter();
	}

	// ========== Project Management Methods ==========

	async createProject(params: {
		name: string;
		boardWidth: number;
		boardHeight: number;
		layers?: number;
	}): Promise<{ success: boolean; projectPath?: string }> {
		return this.project.createProject(params);
	}

	async openProject(params: {
		path: string;
	}): Promise<{ success: boolean; projectName?: string }> {
		return this.project.openProject(params);
	}

	async saveProject(): Promise<{ success: boolean }> {
		return this.project.saveProject();
	}

	async getProjectInfo(): Promise<{
		success: boolean;
		name?: string;
		boardWidth?: number;
		boardHeight?: number;
		layers?: number;
	}> {
		return this.project.getProjectInfo();
	}

	// ========== Component Placement Methods (Stubs) ==========

	async placeComponent(params: {
		ref: string;
		footprint: string;
		x: number;
		y: number;
		rotation?: number;
		layer?: string;
	}): Promise<{ success: boolean; component?: any }> {
		return this.componentPlacement.placeComponent(params);
	}

	async moveComponent(params: {
		ref: string;
		x: number;
		y: number;
		rotation?: number;
	}): Promise<{ success: boolean; newPosition?: any }> {
		return this.componentPlacement.moveComponent(params);
	}

	async rotateComponent(params: {
		ref: string;
		angle: number;
	}): Promise<{ success: boolean; newAngle?: number }> {
		return this.componentPlacement.rotateComponent(params);
	}

	async deleteComponent(params: {
		ref: string;
	}): Promise<{ success: boolean }> {
		return this.componentPlacement.deleteComponent(params);
	}

	async getComponent(params: {
		ref: string;
	}): Promise<{ success: boolean; component?: any }> {
		return this.componentPlacement.getComponent(params);
	}

	// ========== Routing Methods (Stubs) ==========

	async routeTrace(params: {
		net: string;
		points: Array<{ x: number; y: number }>;
		width: number;
		layer: string;
	}): Promise<{ success: boolean; traceId?: string }> {
		return this.routing.routeTrace(params);
	}

	async addVia(params: {
		x: number;
		y: number;
		drillSize: number;
		size: number;
		net?: string;
	}): Promise<{ success: boolean; viaId?: string }> {
		return this.routing.addVia(params);
	}

	async deleteTrace(params: {
		traceId: string;
	}): Promise<{ success: boolean }> {
		return this.routing.deleteTrace(params);
	}

	// ========== Layer Management Methods ==========

	async setActiveLayer(params: {
		layer: string;
	}): Promise<{ success: boolean; activeLayer?: string }> {
		return this.layer.setActiveLayer(params);
	}

	async getLayerList(): Promise<{
		success: boolean;
		layers?: Array<{
			id: string;
			name: string;
			type: string;
			visible: boolean;
		}>;
	}> {
		return this.layer.getLayerList();
	}

	async addLayer(params: {
		name: string;
		type: string;
		position: number;
	}): Promise<{ success: boolean; layerId?: string }> {
		return this.layer.addLayer(params);
	}

	// ========== DRC Methods (Stubs) ==========

	async runDRC(params?: {
		fixAutomatically?: boolean;
	}): Promise<{
		success: boolean;
		errors?: Array<{ type: string; message: string; position?: { x: number; y: number } }>;
		warnings?: Array<{ type: string; message: string; position?: { x: number; y: number } }>;
	}> {
		return this.drc.runDRC(params);
	}

	async getDRCReport(): Promise<{
		success: boolean;
		report?: any;
	}> {
		return this.drc.getDRCReport();
	}

	async clearDRCMarkers(): Promise<{ success: boolean }> {
		return this.drc.clearDRCMarkers();
	}

	// ========== Board Info Methods ==========

	async getBoardOutlineSize(
		params: { unit?: 'mm' | 'mil' | 'inch' } = {}
	): Promise<{
		success: boolean;
		boardOutline?: {
			widthMM: number;
			heightMM: number;
			widthMil: number;
			heightMil: number;
			widthInch: number;
			heightInch: number;
			layer: number;
			primitiveId: string;
			outlineCount: number;
		};
		error?: string;
	}> {
		return this.boardInfo.getBoardOutlineSize(params);
	}

	async getBoardOutlinePosition(): Promise<{
		success: boolean;
		boardOutline?: {
			primitiveId: string;
			layer: number;
			boundingBox: {
				minX: number;
				minY: number;
				maxX: number;
				maxY: number;
				centerX: number;
				centerY: number;
				width: number;
				height: number;
			};
			vertices: Array<{
				x: number;
				y: number;
				type: string;
			}>;
			outlineCount: number;
		};
		error?: string;
	}> {
		return this.boardInfo.getBoardOutlinePosition();
	}

	// ========== Component Query Methods ==========

	async getTopLayerComponents(): Promise<{
		success: boolean;
		components?: Array<{
			designator: string;
			primitiveId: string;
			layer: number;
			x: number;
			y: number;
			rotation: number;
		}>;
		count?: number;
		error?: string;
	}> {
		return this.componentQuery.getTopLayerComponents();
	}

	async getBottomLayerComponents(): Promise<{
		success: boolean;
		components?: Array<{
			designator: string;
			primitiveId: string;
			layer: number;
			x: number;
			y: number;
			rotation: number;
		}>;
		count?: number;
		error?: string;
	}> {
		return this.componentQuery.getBottomLayerComponents();
	}

	async getAllComponents(): Promise<{
		success: boolean;
		components?: Array<{
			designator: string;
			primitiveId: string;
			layer: number;
			layerName: string;
			x: number;
			y: number;
			rotation: number;
		}>;
		stats?: {
			total: number;
			topLayer: number;
			bottomLayer: number;
		};
		error?: string;
	}> {
		return this.componentQuery.getAllComponents();
	}

	async findComponentByDesignator(params: {
		designator: string;
	}): Promise<{
		success: boolean;
		component?: {
			designator: string;
			primitiveId: string;
			layer: number;
			x: number;
			y: number;
			rotation: number;
		};
		error?: string;
	}> {
		return this.componentQuery.findComponentByDesignator(params);
	}

	async getComponentPads(params: {
		primitiveId: string;
	}): Promise<{
		success: boolean;
		pads?: Array<{
			padNumber: string;
			primitiveId: string;
			x: number;
			y: number;
		}>;
		count?: number;
		error?: string;
	}> {
		return this.componentQuery.getComponentPads(params);
	}

	async calculateComponentRelativePosition(params: {
		designator1: string;
		designator2: string;
		unit?: 'mm' | 'mil' | 'inch';
	}): Promise<{
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
		return this.componentQuery.calculateComponentRelativePosition(params);
	}

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
		return this.componentQuery.findNearbyComponents(params);
	}

	async calculateComponentBoundingBox(params: {
		designator: string;
		safetyMargin?: number;
		unit?: 'mm' | 'mil' | 'inch';
	}): Promise<{
		success: boolean;
		boundingBox?: any;
		error?: string;
	}> {
		return this.componentQuery.calculateComponentBoundingBox(params);
	}

	async checkComponentCollision(params: {
		referenceDesignator: string;
		checkMode: 'spacing' | 'overlap' | 'both';
		minSpacing?: number;
		boundingBoxType?: 'raw' | 'actual';
		unit?: 'mm' | 'mil' | 'inch';
		layer?: 'top' | 'bottom' | 'all';
		excludeDesignators?: string[];
		maxResults?: number;
	}): Promise<any> {
		return this.componentQuery.checkComponentCollision(params);
	}

	// ========== Component Transform Methods ==========

	async setComponentTransform(params: {
		designator: string;
		x?: number;
		y?: number;
		rotation?: number;
		layer?: number;
	}): Promise<{
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
	}> {
		return this.componentTransform.setComponentTransform(params);
	}

	// ========== Netlist Methods ==========

	async generateNetlistMap(): Promise<{
		success: boolean;
		netToPinsMap?: Record<string, Array<{
			designator: string;
			padNumber: string;
			x: number;
			y: number;
		}>>;
		componentToNetsMap?: Record<string, string[]>;
		stats?: {
			totalNets: number;
			totalConnections: number;
			totalComponents: number;
			avgPinsPerNet: number;
		};
		topNets?: Array<{ net: string; pinCount: number }>;
		error?: string;
	}> {
		return this.netlist.generateNetlistMap();
	}

	// ========== Layer Count Methods ==========

	async getLayerCount(): Promise<{
		success: boolean;
		layerCount?: {
			topLayer: boolean;
			bottomLayer: boolean;
			innerLayerCount: number;
			copperLayerCount: number;
			allLayersCount: number;
			enabledLayersCount: number;
		};
		error?: string;
	}> {
		return this.layer.getLayerCount();
	}
}
