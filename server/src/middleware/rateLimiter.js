// Security middleware configuration for production
import rateLimit from 'express-rate-limit'

// Rate limiter for auth endpoints (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: { 
    message: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: 15 * 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: { 
    message: 'Too many requests. Please try again later.',
    retryAfter: 15 * 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// AI endpoint rate limiter (more restrictive)
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { 
    message: 'AI service rate limit exceeded. Please wait before making more requests.',
    retryAfter: 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
})
