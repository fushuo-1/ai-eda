/**
 * Schematic-related Zod schemas
 */
import { z } from 'zod';
/**
 * Component type enumeration
 */
export var ComponentType;
(function (ComponentType) {
    ComponentType["COMPONENT"] = "COMPONENT";
    ComponentType["DRAWING"] = "DRAWING";
    ComponentType["NET_FLAG"] = "NET_FLAG";
    ComponentType["NET_PORT"] = "NET_PORT";
    ComponentType["NET_LABEL"] = "NET_LABEL";
    ComponentType["NON_ELECTRICAL_FLAG"] = "NON_ELECTRICAL_FLAG";
    ComponentType["SHORT_CIRCUIT_FLAG"] = "SHORT_CIRCUIT_FLAG";
})(ComponentType || (ComponentType = {}));
/**
 * Get all schematic components schema
 */
export const schGetAllComponentsSchema = z.object({
    componentType: z.nativeEnum(ComponentType).optional().describe('Filter by component type'),
    allSchematicPages: z.boolean()
        .default(false)
        .describe('Get components from all schematic pages (default: current page only)'),
});
/**
 * Get component by designator schema
 */
export const schGetComponentByDesignatorSchema = z.object({
    designator: z.string()
        .min(1, 'Designator is required')
        .describe('Component designator (e.g., "R1", "C1", "Q4", "U1")'),
});
/**
 * Get component pins schema
 */
export const schGetComponentPinsSchema = z.object({
    primitiveId: z.string()
        .min(1, 'Primitive ID is required')
        .describe('Component primitive ID'),
});
//# sourceMappingURL=schematic.js.map