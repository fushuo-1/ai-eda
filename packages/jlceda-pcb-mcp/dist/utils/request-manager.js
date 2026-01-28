/**
 * Request Manager - Prevents memory leaks from pending requests
 *
 * Automatically cleans up expired request timers to prevent memory leaks
 */
export class RequestManager {
    pendingRequests = new Map();
    maxAge;
    constructor(maxAge = 300000) {
        this.maxAge = maxAge;
    }
    /**
     * Add a request timer with automatic cleanup
     * @param id - Request ID
     * @param timer - Timeout timer
     */
    set(id, timer) {
        // Clean up old requests periodically
        this.cleanup();
        // Set the new request timer
        this.pendingRequests.set(id, timer);
        // Create a cleanup timer for this request
        const cleanupTimer = setTimeout(() => {
            this.pendingRequests.delete(id);
            this.pendingRequests.delete(`${id}_cleanup`);
        }, this.maxAge);
        this.pendingRequests.set(`${id}_cleanup`, cleanupTimer);
    }
    /**
     * Remove a request timer
     * @param id - Request ID
     * @returns true if the request was found and removed
     */
    delete(id) {
        // Delete the cleanup timer first
        this.pendingRequests.delete(`${id}_cleanup`);
        // Then delete the request timer
        return this.pendingRequests.delete(id);
    }
    /**
     * Clean up expired requests
     * Called automatically when new requests are added
     */
    cleanup() {
        const now = Date.now();
        // Clean up expired cleanup timers
        for (const [id, timer] of this.pendingRequests) {
            if (id.endsWith('_cleanup')) {
                const timerInfo = timer;
                if (timerInfo._idleStart && (now - timerInfo._idleStart) > this.maxAge) {
                    clearTimeout(timer);
                    this.pendingRequests.delete(id);
                }
            }
        }
    }
    /**
     * Clear all pending requests
     * Call this when shutting down the server
     */
    clear() {
        for (const timer of this.pendingRequests.values()) {
            clearTimeout(timer);
        }
        this.pendingRequests.clear();
    }
    /**
     * Get the number of pending requests
     */
    get size() {
        // Only count actual requests, not cleanup timers
        let count = 0;
        for (const id of this.pendingRequests.keys()) {
            if (!id.endsWith('_cleanup')) {
                count++;
            }
        }
        return count;
    }
}
//# sourceMappingURL=request-manager.js.map