interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limit store with auto-cleanup
const rateLimitMap = new Map<string, RateLimitEntry>();

// Periodic cleanup every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (entry.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
}

/**
 * Sliding window rate limiter for stage run endpoints
 * Default: 20 requests per 60 seconds window
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

