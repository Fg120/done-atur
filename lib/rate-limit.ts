interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

interface RateLimitState {
  count: number
  reset: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

const buckets = new Map<string, RateLimitState>()

export function applyRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(options.key)

  if (!bucket || bucket.reset <= now) {
    const resetAt = now + options.windowMs
    buckets.set(options.key, { count: 1, reset: resetAt })
    return {
      success: true,
      remaining: options.limit - 1,
      reset: resetAt,
      limit: options.limit,
    }
  }

  if (bucket.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      reset: bucket.reset,
      limit: options.limit,
    }
  }

  bucket.count += 1
  buckets.set(options.key, bucket)

  return {
    success: true,
    remaining: options.limit - bucket.count,
    reset: bucket.reset,
    limit: options.limit,
  }
}

export function formatRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": Math.max(result.remaining, 0).toString(),
    "X-RateLimit-Reset": Math.ceil(result.reset / 1000).toString(),
  }
}
