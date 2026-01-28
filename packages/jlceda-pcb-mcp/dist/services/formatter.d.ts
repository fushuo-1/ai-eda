/**
 * Response formatting utilities
 */
import { ResponseFormat } from '../schemas/common.js';
interface ComponentBoundingBox {
    unrotated: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    };
    raw: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    };
    actual: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    };
    dimensions: {
        unrotated: {
            widthMM: number;
            widthMil: number;
            widthInch: number;
            heightMM: number;
            heightMil: number;
            heightInch: number;
        };
        raw: {
            widthMM: number;
            widthMil: number;
            widthInch: number;
            heightMM: number;
            heightMil: number;
            heightInch: number;
        };
        actual: {
            widthMM: number;
            widthMil: number;
            widthInch: number;
            heightMM: number;
            heightMil: number;
            heightInch: number;
        };
    };
    component: {
        designator: string;
        primitiveId: string;
        layer: number;
        x: number;
        y: number;
        rotation: number;
    };
    calculationDetails: {
        padCount: number;
        safetyMarginMil: number;
        safetyMarginMM: number;
        executionTimeMs: number;
        warnings?: string[];
    };
}
export interface FormatOptions {
    format: ResponseFormat;
    characterLimit?: number;
}
/**
 * Format response based on requested format
 * @param data - Structured data to format
 * @param format - Response format (markdown or json)
 * @param markdownFormatter - Function to format data as markdown
 * @returns Object with text content and optional structured data
 */
export declare function formatResponse<T>(data: T, format: ResponseFormat, markdownFormatter: (data: T) => string): {
    text: string;
    structured?: T;
};
/**
 * Truncate response if it exceeds character limit
 * @param text - Text to truncate
 * @param limit - Character limit
 * @param item - Item name for truncation message
 * @returns Truncated text with warning message if needed
 */
export declare function truncateResponse(text: string, limit?: number, item?: string): string;
/**
 * Format board outline size as markdown
 */
export declare function formatBoardOutlineMarkdown(outline: any): string;
/**
 * Format PCB components list as markdown
 */
export declare function formatPCBComponentsMarkdown(result: any): string;
/**
 * Format schematic component as markdown
 */
export declare function formatSchematicComponentMarkdown(component: any): string;
/**
 * Format PCB layer count as markdown
 */
export declare function formatLayerCountMarkdown(result: any): string;
/**
 * Format component relative position as markdown
 */
export declare function formatComponentRelativePositionMarkdown(result: any, preferredUnit?: string): string;
/**
 * Format nearby components as markdown
 */
export declare function formatNearbyComponentsMarkdown(result: any, preferredUnit?: string): string;
/**
 * Format component bounding box as markdown
 */
export declare function formatComponentBoundingBoxMarkdown(bbox: ComponentBoundingBox, preferredUnit?: string): string;
/**
 * Format collision check result as markdown
 */
export declare function formatCollisionCheckMarkdown(result: any, preferredUnit?: string): string;
/**
 * Format overlap check result as markdown (specialized for overlap detection)
 */
export declare function formatOverlapCheckMarkdown(result: any): string;
/**
 * Format spacing check result as markdown (specialized for spacing detection)
 */
export declare function formatSpacingCheckMarkdown(result: any, preferredUnit?: string): string;
export {};
//# sourceMappingURL=formatter.d.ts.map