/**
 * Common Zod schemas for MCP tools
 */
import { z } from 'zod';
/**
 * Response format enumeration
 */
export var ResponseFormat;
(function (ResponseFormat) {
    ResponseFormat["MARKDOWN"] = "markdown";
    ResponseFormat["JSON"] = "json";
})(ResponseFormat || (ResponseFormat = {}));
/**
 * Response format schema
 * Defaults to MARKDOWN for human-readable output
 */
export const responseFormatSchema = z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe('Output format: markdown (human-readable) or json (machine-readable)');
/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
    limit: z.number()
        .int('limit must be an integer')
        .min(1, 'limit must be at least 1')
        .max(100, 'limit must not exceed 100')
        .default(20)
        .describe('Maximum number of results to return'),
    offset: z.number()
        .int('offset must be an integer')
        .min(0, 'offset cannot be negative')
        .default(0)
        .describe('Number of results to skip for pagination'),
});
//# sourceMappingURL=common.js.map