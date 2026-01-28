/**
 * Schematic-related Zod schemas
 */
import { z } from 'zod';
/**
 * Component type enumeration
 */
export declare enum ComponentType {
    COMPONENT = "COMPONENT",
    DRAWING = "DRAWING",
    NET_FLAG = "NET_FLAG",
    NET_PORT = "NET_PORT",
    NET_LABEL = "NET_LABEL",
    NON_ELECTRICAL_FLAG = "NON_ELECTRICAL_FLAG",
    SHORT_CIRCUIT_FLAG = "SHORT_CIRCUIT_FLAG"
}
/**
 * Get all schematic components schema
 */
export declare const schGetAllComponentsSchema: z.ZodObject<{
    componentType: z.ZodOptional<z.ZodNativeEnum<typeof ComponentType>>;
    allSchematicPages: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    allSchematicPages: boolean;
    componentType?: ComponentType | undefined;
}, {
    componentType?: ComponentType | undefined;
    allSchematicPages?: boolean | undefined;
}>;
/**
 * Get component by designator schema
 */
export declare const schGetComponentByDesignatorSchema: z.ZodObject<{
    designator: z.ZodString;
}, "strip", z.ZodTypeAny, {
    designator: string;
}, {
    designator: string;
}>;
/**
 * Get component pins schema
 */
export declare const schGetComponentPinsSchema: z.ZodObject<{
    primitiveId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    primitiveId: string;
}, {
    primitiveId: string;
}>;
//# sourceMappingURL=schematic.d.ts.map