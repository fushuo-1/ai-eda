/**
 * Schematic-related Zod schemas
 */

import { z } from 'zod';

/**
 * Component type enumeration
 */
export enum ComponentType {
  COMPONENT = 'COMPONENT',
  DRAWING = 'DRAWING',
  NET_FLAG = 'NET_FLAG',
  NET_PORT = 'NET_PORT',
  NET_LABEL = 'NET_LABEL',
  NON_ELECTRICAL_FLAG = 'NON_ELECTRICAL_FLAG',
  SHORT_CIRCUIT_FLAG = 'SHORT_CIRCUIT_FLAG',
}

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

/**
 * Get schematic netlist schema
 */
export const schGetNetlistSchema = z.object({
  includeRaw: z.boolean()
    .default(false)
    .describe('Include raw netlist string in response'),
});

/**
 * Get schematic BOM schema
 */
export const schGetBomSchema = z.object({
  groupByValue: z.boolean()
    .default(true)
    .describe('Group components by value and footprint'),
  includeNonBom: z.boolean()
    .default(false)
    .describe('Include components not marked for BOM'),
});
