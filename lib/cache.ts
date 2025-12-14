/**
 * Simple in-memory cache for API responses
 * Reduces database queries and API calls
 */

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
}

class APICache {
    private cache: Map<string, CacheEntry<any>> = new Map()
    private defaultTTL = 60 * 1000 // 1 minute default

    /**
     * Get cached data
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key)

        if (!entry) return null

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key)
            return null
        }

        return entry.data as T
    }

    /**
     * Set cached data
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        })
    }

    /**
     * Delete cached entry
     */
    delete(key: string): boolean {
        return this.cache.delete(key)
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear()
    }

    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null
    }

    /**
     * Get cache stats
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        }
    }
}

// Singleton instance
export const apiCache = new APICache()

// Cache keys
export const CACHE_KEYS = {
    DASHBOARD_STATS: 'dashboard_stats',
    RECENT_THREATS: 'recent_threats',
    USER_LOGS: (userId: string) => `user_logs_${userId}`,
    ANALYSIS: (id: string) => `analysis_${id}`,
}

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
    SHORT: 30 * 1000,      // 30 seconds
    MEDIUM: 60 * 1000,     // 1 minute
    LONG: 5 * 60 * 1000,   // 5 minutes
    VERY_LONG: 30 * 60 * 1000, // 30 minutes
}

/**
 * Cached fetch wrapper
 */
export async function cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
    // Check cache first
    const cached = apiCache.get<T>(key)
    if (cached !== null) {
        return cached
    }

    // Fetch fresh data
    const data = await fetcher()

    // Store in cache
    apiCache.set(key, data, ttl)

    return data
}

/**
 * Debounce function for rapid API calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}
