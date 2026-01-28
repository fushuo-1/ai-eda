/**
 * Request Manager - Prevents memory leaks from pending requests
 *
 * Automatically cleans up expired request timers to prevent memory leaks
 */
export declare class RequestManager {
    private pendingRequests;
    private readonly maxAge;
    constructor(maxAge?: number);
    /**
     * Add a request timer with automatic cleanup
     * @param id - Request ID
     * @param timer - Timeout timer
     */
    set(id: string, timer: NodeJS.Timeout): void;
    /**
     * Remove a request timer
     * @param id - Request ID
     * @returns true if the request was found and removed
     */
    delete(id: string): boolean;
    /**
     * Clean up expired requests
     * Called automatically when new requests are added
     */
    private cleanup;
    /**
     * Clear all pending requests
     * Call this when shutting down the server
     */
    clear(): void;
    /**
     * Get the number of pending requests
     */
    get size(): number;
}
//# sourceMappingURL=request-manager.d.ts.map