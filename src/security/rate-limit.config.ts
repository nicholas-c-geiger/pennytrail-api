import rateLimit from 'express-rate-limit';

export function createRateLimitConfig() {
  return rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW),
    max: Number(process.env.RATE_LIMIT_MAX),
    message: {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'You have hit the request limit. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
