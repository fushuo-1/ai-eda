/**
 * PCB-related Zod schemas
 */
import { z } from 'zod';
/**
 * Board unit enumeration
 */
export var BoardUnit;
(function (BoardUnit) {
    BoardUnit["MM"] = "mm";
    BoardUnit["MIL"] = "mil";
    BoardUnit["INCH"] = "inch";
})(BoardUnit || (BoardUnit = {}));
/**
 * PCB layer enumeration
 */
export var PCBLayer;
(function (PCBLayer) {
    PCBLayer[PCBLayer["TOP"] = 1] = "TOP";
    PCBLayer[PCBLayer["BOTTOM"] = 2] = "BOTTOM";
})(PCBLayer || (PCBLayer = {}));
/**
 * Get board outline size schema
 */
export const pcbGetBoardOutlineSizeSchema = z.object({
    unit: z.nativeEnum(BoardUnit).optional().describe('Preferred unit (mm/mil/inch)'),
});
/**
 * Find component by designator schema
 */
export const pcbFindComponentByDesignatorSchema = z.object({
    designator: z.string()
        .min(1, 'Designator is required')
        .describe('Component designator (e.g., "R1", "C1", "U1")'),
});
/**
 * Get component pads schema
 */
export const pcbGetComponentPadsSchema = z.object({
    primitiveId: z.string()
        .min(1, 'Primitive ID is required')
        .describe('Component primitive ID'),
});
/**
 * Set component transform schema
 */
export const pcbSetComponentTransformSchema = z.object({
    designator: z.string()
        .min(1, 'Designator is required')
        .describe('Component designator (e.g., "R1", "C1", "U1")'),
    x: z.coerce.number().optional().describe('X coordinate in mil'),
    y: z.coerce.number().optional().describe('Y coordinate in mil'),
    rotation: z.coerce.number()
        .optional()
        .describe('Rotation angle in degrees (0-360)'),
    layer: z.nativeEnum(PCBLayer).optional().describe('Layer (1=TOP, 2=BOTTOM)'),
}).refine((data) => data.x !== undefined || data.y !== undefined ||
    data.rotation !== undefined || data.layer !== undefined, {
    message: 'At least one of x, y, rotation, or layer must be provided',
});
/**
 * Generate netlist map schema
 */
export const pcbGenerateNetlistMapSchema = z.object({
    maxNetworks: z.number()
        .int()
        .min(0)
        .optional()
        .describe('Maximum number of networks to display (0 = all)'),
    maxComponents: z.number()
        .int()
        .min(0)
        .optional()
        .describe('Maximum number of components to display (0 = all)'),
    maxPinsPerNet: z.number()
        .int()
        .min(0)
        .optional()
        .describe('Maximum pins per network to display (0 = all)'),
});
/**
 * Get layer count schema (no parameters required)
 */
export const pcbGetLayerCountSchema = z
    .object({}).describe('Get PCB layer count information (no parameters required)');
/**
 * Calculate component relative position schema
 */
export const pcbCalculateComponentRelativePositionSchema = z.object({
    designator1: z.string()
        .min(1, 'Designator1 is required')
        .describe('第一个元器件位号（如"R1"）'),
    designator2: z.string()
        .min(1, 'Designator2 is required')
        .describe('第二个元器件位号（如"U1"）'),
    unit: z.nativeEnum(BoardUnit).optional()
        .describe('输出单位（mm/mil/inch，默认mm）'),
});
/**
 * Search mode enumeration for nearby components
 */
export var NearbySearchMode;
(function (NearbySearchMode) {
    NearbySearchMode["KNN"] = "knn";
    NearbySearchMode["RADIUS"] = "radius";
    NearbySearchMode["DIRECTION"] = "direction";
})(NearbySearchMode || (NearbySearchMode = {}));
/**
 * Direction enumeration for direction-based search
 */
export var NearbyDirection;
(function (NearbyDirection) {
    NearbyDirection["ALL"] = "all";
    NearbyDirection["N"] = "N";
    NearbyDirection["S"] = "S";
    NearbyDirection["E"] = "E";
    NearbyDirection["W"] = "W";
    NearbyDirection["NE"] = "NE";
    NearbyDirection["NW"] = "NW";
    NearbyDirection["SE"] = "SE";
    NearbyDirection["SW"] = "SW";
})(NearbyDirection || (NearbyDirection = {}));
/**
 * Layer filter enumeration
 */
export var NearbyLayerFilter;
(function (NearbyLayerFilter) {
    NearbyLayerFilter["TOP"] = "top";
    NearbyLayerFilter["BOTTOM"] = "bottom";
    NearbyLayerFilter["ALL"] = "all";
})(NearbyLayerFilter || (NearbyLayerFilter = {}));
/**
 * Sort by enumeration
 */
export var NearbySortBy;
(function (NearbySortBy) {
    NearbySortBy["DISTANCE"] = "distance";
    NearbySortBy["ANGLE"] = "angle";
    NearbySortBy["DESIGNATOR"] = "designator";
})(NearbySortBy || (NearbySortBy = {}));
/**
 * Find nearby components schema
 */
export const pcbFindNearbyComponentsSchema = z.object({
    referenceDesignator: z.string().min(1),
    searchMode: z.nativeEnum(NearbySearchMode),
    k: z.number().int().min(1).max(100).optional(),
    maxDistance: z.number().positive().optional(),
    unit: z.nativeEnum(BoardUnit).optional(),
    direction: z.nativeEnum(NearbyDirection).optional(),
    layer: z.nativeEnum(NearbyLayerFilter).optional(),
    includeReference: z.boolean().optional().default(false),
    excludeDesignators: z.array(z.string()).optional(),
    minDistance: z.number().min(0).optional(),
    sortBy: z.nativeEnum(NearbySortBy).optional(),
    // 边界盒重叠检测参数
    useBoundingBoxOverlap: z.boolean().optional().default(true)
        .describe('启用边界盒重叠检测（默认true）'),
    boundingBoxType: z.enum(['raw', 'actual']).optional().default('raw')
        .describe('边界盒类型：raw=原始尺寸，actual=含安全裕量（默认raw）'),
});
/**
 * Calculate component bounding box schema
 */
export const pcbCalculateComponentBoundingBoxSchema = z.object({
    designator: z.string()
        .min(1, 'Designator is required')
        .describe('元器件位号（如"R1", "C1", "U1"）'),
    safetyMargin: z.number()
        .positive()
        .optional()
        .default(50)
        .describe('安全裕量，单位：mil（默认50mil，约1.27mm）'),
    unit: z.nativeEnum(BoardUnit).optional()
        .describe('输出单位（mm/mil/inch，默认mm）'),
});
/**
 * Collision check mode enumeration
 */
export var CollisionCheckMode;
(function (CollisionCheckMode) {
    CollisionCheckMode["SPACING"] = "spacing";
    CollisionCheckMode["OVERLAP"] = "overlap";
    CollisionCheckMode["BOTH"] = "both";
})(CollisionCheckMode || (CollisionCheckMode = {}));
/**
 * Check component collision schema
 */
export const pcbCheckComponentCollisionSchema = z.object({
    referenceDesignator: z.string()
        .min(1, 'Reference designator is required')
        .describe('参考元器件位号（如"R1", "U1"）'),
    checkMode: z.nativeEnum(CollisionCheckMode)
        .describe('检测模式：spacing=间距检查，overlap=边界盒重叠，both=两者都检查'),
    minSpacing: z.number()
        .positive()
        .optional()
        .describe('最小间距要求（单位由unit参数指定）'),
    boundingBoxType: z.enum(['raw', 'actual'])
        .optional()
        .default('raw')
        .describe('边界盒类型：raw=原始尺寸，actual=含安全裕量（默认raw）'),
    unit: z.nativeEnum(BoardUnit)
        .optional()
        .default(BoardUnit.MIL)
        .describe('距离单位（mm/mil/inch，默认mil）'),
    layer: z.nativeEnum(NearbyLayerFilter)
        .optional()
        .default(NearbyLayerFilter.ALL)
        .describe('层级过滤：top/bottom/all（默认all）'),
    excludeDesignators: z.array(z.string())
        .optional()
        .describe('排除检查的器件位号列表'),
    maxResults: z.number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .default(100)
        .describe('最大返回结果数（默认100）'),
});
/**
 * Check component overlap schema (no minSpacing required)
 */
export const pcbCheckComponentOverlapSchema = z.object({
    referenceDesignator: z.string()
        .min(1, 'Reference designator is required')
        .describe('参考元器件位号（如"R1", "U1"）'),
    boundingBoxType: z.enum(['raw', 'actual'])
        .optional()
        .default('raw')
        .describe('边界盒类型：raw=原始尺寸，actual=含安全裕量（默认raw）'),
    layer: z.nativeEnum(NearbyLayerFilter)
        .optional()
        .default(NearbyLayerFilter.ALL)
        .describe('层级过滤：top/bottom/all（默认all）'),
    excludeDesignators: z.array(z.string())
        .optional()
        .describe('排除检查的器件位号列表'),
    maxResults: z.number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .default(100)
        .describe('最大返回结果数（默认100）'),
});
/**
 * Check component spacing schema (minSpacing required)
 */
export const pcbCheckComponentSpacingSchema = z.object({
    referenceDesignator: z.string()
        .min(1, 'Reference designator is required')
        .describe('参考元器件位号（如"R1", "U1"）'),
    minSpacing: z.number()
        .positive()
        .describe('最小间距要求（单位由unit参数指定）'),
    boundingBoxType: z.enum(['raw', 'actual'])
        .optional()
        .default('raw')
        .describe('边界盒类型：raw=原始尺寸，actual=含安全裕量（默认raw）'),
    unit: z.nativeEnum(BoardUnit)
        .optional()
        .default(BoardUnit.MIL)
        .describe('距离单位（mm/mil/inch，默认mil）'),
    layer: z.nativeEnum(NearbyLayerFilter)
        .optional()
        .default(NearbyLayerFilter.ALL)
        .describe('层级过滤：top/bottom/all（默认all）'),
    excludeDesignators: z.array(z.string())
        .optional()
        .describe('排除检查的器件位号列表'),
    maxResults: z.number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .default(100)
        .describe('最大返回结果数（默认100）'),
});
//# sourceMappingURL=pcb.js.map