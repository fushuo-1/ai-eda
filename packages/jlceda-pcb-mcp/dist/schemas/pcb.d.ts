/**
 * PCB-related Zod schemas
 */
import { z } from 'zod';
/**
 * Board unit enumeration
 */
export declare enum BoardUnit {
    MM = "mm",
    MIL = "mil",
    INCH = "inch"
}
/**
 * PCB layer enumeration
 */
export declare enum PCBLayer {
    TOP = 1,
    BOTTOM = 2
}
/**
 * Get board outline size schema
 */
export declare const pcbGetBoardOutlineSizeSchema: z.ZodObject<{
    unit: z.ZodOptional<z.ZodNativeEnum<typeof BoardUnit>>;
}, "strip", z.ZodTypeAny, {
    unit?: BoardUnit | undefined;
}, {
    unit?: BoardUnit | undefined;
}>;
/**
 * Find component by designator schema
 */
export declare const pcbFindComponentByDesignatorSchema: z.ZodObject<{
    designator: z.ZodString;
}, "strip", z.ZodTypeAny, {
    designator: string;
}, {
    designator: string;
}>;
/**
 * Get component pads schema
 */
export declare const pcbGetComponentPadsSchema: z.ZodObject<{
    primitiveId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    primitiveId: string;
}, {
    primitiveId: string;
}>;
/**
 * Set component transform schema
 */
export declare const pcbSetComponentTransformSchema: z.ZodEffects<z.ZodObject<{
    designator: z.ZodString;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    rotation: z.ZodOptional<z.ZodNumber>;
    layer: z.ZodOptional<z.ZodNativeEnum<typeof PCBLayer>>;
}, "strip", z.ZodTypeAny, {
    designator: string;
    x?: number | undefined;
    y?: number | undefined;
    rotation?: number | undefined;
    layer?: PCBLayer | undefined;
}, {
    designator: string;
    x?: number | undefined;
    y?: number | undefined;
    rotation?: number | undefined;
    layer?: PCBLayer | undefined;
}>, {
    designator: string;
    x?: number | undefined;
    y?: number | undefined;
    rotation?: number | undefined;
    layer?: PCBLayer | undefined;
}, {
    designator: string;
    x?: number | undefined;
    y?: number | undefined;
    rotation?: number | undefined;
    layer?: PCBLayer | undefined;
}>;
/**
 * Generate netlist map schema
 */
export declare const pcbGenerateNetlistMapSchema: z.ZodObject<{
    maxNetworks: z.ZodOptional<z.ZodNumber>;
    maxComponents: z.ZodOptional<z.ZodNumber>;
    maxPinsPerNet: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxNetworks?: number | undefined;
    maxComponents?: number | undefined;
    maxPinsPerNet?: number | undefined;
}, {
    maxNetworks?: number | undefined;
    maxComponents?: number | undefined;
    maxPinsPerNet?: number | undefined;
}>;
/**
 * Get layer count schema (no parameters required)
 */
export declare const pcbGetLayerCountSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
/**
 * Calculate component relative position schema
 */
export declare const pcbCalculateComponentRelativePositionSchema: z.ZodObject<{
    designator1: z.ZodString;
    designator2: z.ZodString;
    unit: z.ZodOptional<z.ZodNativeEnum<typeof BoardUnit>>;
}, "strip", z.ZodTypeAny, {
    designator1: string;
    designator2: string;
    unit?: BoardUnit | undefined;
}, {
    designator1: string;
    designator2: string;
    unit?: BoardUnit | undefined;
}>;
/**
 * Search mode enumeration for nearby components
 */
export declare enum NearbySearchMode {
    KNN = "knn",
    RADIUS = "radius",
    DIRECTION = "direction"
}
/**
 * Direction enumeration for direction-based search
 */
export declare enum NearbyDirection {
    ALL = "all",
    N = "N",
    S = "S",
    E = "E",
    W = "W",
    NE = "NE",
    NW = "NW",
    SE = "SE",
    SW = "SW"
}
/**
 * Layer filter enumeration
 */
export declare enum NearbyLayerFilter {
    TOP = "top",
    BOTTOM = "bottom",
    ALL = "all"
}
/**
 * Sort by enumeration
 */
export declare enum NearbySortBy {
    DISTANCE = "distance",
    ANGLE = "angle",
    DESIGNATOR = "designator"
}
/**
 * Find nearby components schema
 */
export declare const pcbFindNearbyComponentsSchema: z.ZodObject<{
    referenceDesignator: z.ZodString;
    searchMode: z.ZodNativeEnum<typeof NearbySearchMode>;
    k: z.ZodOptional<z.ZodNumber>;
    maxDistance: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodNativeEnum<typeof BoardUnit>>;
    direction: z.ZodOptional<z.ZodNativeEnum<typeof NearbyDirection>>;
    layer: z.ZodOptional<z.ZodNativeEnum<typeof NearbyLayerFilter>>;
    includeReference: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    excludeDesignators: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minDistance: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodNativeEnum<typeof NearbySortBy>>;
    useBoundingBoxOverlap: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    boundingBoxType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["raw", "actual"]>>>;
}, "strip", z.ZodTypeAny, {
    referenceDesignator: string;
    searchMode: NearbySearchMode;
    includeReference: boolean;
    useBoundingBoxOverlap: boolean;
    boundingBoxType: "raw" | "actual";
    unit?: BoardUnit | undefined;
    layer?: NearbyLayerFilter | undefined;
    direction?: NearbyDirection | undefined;
    k?: number | undefined;
    maxDistance?: number | undefined;
    excludeDesignators?: string[] | undefined;
    minDistance?: number | undefined;
    sortBy?: NearbySortBy | undefined;
}, {
    referenceDesignator: string;
    searchMode: NearbySearchMode;
    unit?: BoardUnit | undefined;
    layer?: NearbyLayerFilter | undefined;
    direction?: NearbyDirection | undefined;
    k?: number | undefined;
    maxDistance?: number | undefined;
    includeReference?: boolean | undefined;
    excludeDesignators?: string[] | undefined;
    minDistance?: number | undefined;
    sortBy?: NearbySortBy | undefined;
    useBoundingBoxOverlap?: boolean | undefined;
    boundingBoxType?: "raw" | "actual" | undefined;
}>;
/**
 * Calculate component bounding box schema
 */
export declare const pcbCalculateComponentBoundingBoxSchema: z.ZodObject<{
    designator: z.ZodString;
    safetyMargin: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    unit: z.ZodOptional<z.ZodNativeEnum<typeof BoardUnit>>;
}, "strip", z.ZodTypeAny, {
    designator: string;
    safetyMargin: number;
    unit?: BoardUnit | undefined;
}, {
    designator: string;
    unit?: BoardUnit | undefined;
    safetyMargin?: number | undefined;
}>;
/**
 * Collision check mode enumeration
 */
export declare enum CollisionCheckMode {
    SPACING = "spacing",
    OVERLAP = "overlap",
    BOTH = "both"
}
/**
 * Check component collision schema
 */
export declare const pcbCheckComponentCollisionSchema: z.ZodObject<{
    referenceDesignator: z.ZodString;
    checkMode: z.ZodNativeEnum<typeof CollisionCheckMode>;
    minSpacing: z.ZodOptional<z.ZodNumber>;
    boundingBoxType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["raw", "actual"]>>>;
    unit: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof BoardUnit>>>;
    layer: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof NearbyLayerFilter>>>;
    excludeDesignators: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    unit: BoardUnit;
    layer: NearbyLayerFilter;
    referenceDesignator: string;
    boundingBoxType: "raw" | "actual";
    checkMode: CollisionCheckMode;
    maxResults: number;
    excludeDesignators?: string[] | undefined;
    minSpacing?: number | undefined;
}, {
    referenceDesignator: string;
    checkMode: CollisionCheckMode;
    unit?: BoardUnit | undefined;
    layer?: NearbyLayerFilter | undefined;
    excludeDesignators?: string[] | undefined;
    boundingBoxType?: "raw" | "actual" | undefined;
    minSpacing?: number | undefined;
    maxResults?: number | undefined;
}>;
/**
 * Check component overlap schema (no minSpacing required)
 */
export declare const pcbCheckComponentOverlapSchema: z.ZodObject<{
    referenceDesignator: z.ZodString;
    boundingBoxType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["raw", "actual"]>>>;
    layer: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof NearbyLayerFilter>>>;
    excludeDesignators: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    layer: NearbyLayerFilter;
    referenceDesignator: string;
    boundingBoxType: "raw" | "actual";
    maxResults: number;
    excludeDesignators?: string[] | undefined;
}, {
    referenceDesignator: string;
    layer?: NearbyLayerFilter | undefined;
    excludeDesignators?: string[] | undefined;
    boundingBoxType?: "raw" | "actual" | undefined;
    maxResults?: number | undefined;
}>;
/**
 * Check component spacing schema (minSpacing required)
 */
export declare const pcbCheckComponentSpacingSchema: z.ZodObject<{
    referenceDesignator: z.ZodString;
    minSpacing: z.ZodNumber;
    boundingBoxType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["raw", "actual"]>>>;
    unit: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof BoardUnit>>>;
    layer: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof NearbyLayerFilter>>>;
    excludeDesignators: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    unit: BoardUnit;
    layer: NearbyLayerFilter;
    referenceDesignator: string;
    boundingBoxType: "raw" | "actual";
    minSpacing: number;
    maxResults: number;
    excludeDesignators?: string[] | undefined;
}, {
    referenceDesignator: string;
    minSpacing: number;
    unit?: BoardUnit | undefined;
    layer?: NearbyLayerFilter | undefined;
    excludeDesignators?: string[] | undefined;
    boundingBoxType?: "raw" | "actual" | undefined;
    maxResults?: number | undefined;
}>;
//# sourceMappingURL=pcb.d.ts.map