/**
 * Common Zod schemas for MCP tools
 */
import { z } from 'zod';
/**
 * Response format enumeration
 */
export declare enum ResponseFormat {
    MARKDOWN = "markdown",
    JSON = "json"
}
/**
 * Response format schema
 * Defaults to MARKDOWN for human-readable output
 */
export declare const responseFormatSchema: z.ZodDefault<z.ZodNativeEnum<typeof ResponseFormat>>;
/**
 * Pagination parameters schema
 */
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
/**
 * Extract pagination type from schema
 */
export type PaginationParams = z.infer<typeof paginationSchema>;
//# sourceMappingURL=common.d.ts.map