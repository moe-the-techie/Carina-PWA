import rateLimit from 'express-rate-limit';

/**
 * Rate limiting configuration for different endpoint types
 * Protects against abuse while allowing legitimate traffic
 */

// General API rate limiter - applies to most endpoints
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per IP
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    }
});

// Strict limiter for auth endpoints (login, register, password reset)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false // Count all requests
});

// Limiter for file uploads (images, voice messages)
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: {
        error: 'Too many uploads, please wait before uploading more files.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter for expensive operations (form submissions, plan creation)
export const expensiveOperationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 operations per minute
    message: {
        error: 'Too many requests for this operation, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter for chat messages - more generous but still protected
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: {
        error: 'You are sending messages too quickly, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Admin endpoints - higher limits for admin users
export const adminLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute for admin operations
    message: {
        error: 'Too many admin requests, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Search endpoints - prevent search abuse
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 searches per minute
    message: {
        error: 'Too many search requests, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});
