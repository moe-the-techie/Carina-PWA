import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

/**
 * Rate limiting configuration for different endpoint types
 * Protects against abuse while allowing legitimate traffic
 */

function getAuthenticatedUserId(req) {
    // If an auth middleware already ran, prefer that.
    if (req.user && (req.user._id || req.user.id)) {
        return String(req.user._id || req.user.id);
    }

    // Otherwise, try to derive a stable identity from the bearer token.
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.userId) {
            return String(decoded.userId);
        }
    } catch {
        // Ignore invalid/expired tokens; fall back to IP.
    }

    return null;
}

function userAwareKeyGenerator(req) {
    const userId = getAuthenticatedUserId(req);
    if (userId) return `user:${userId}`;
    return `ip:${req.ip || 'unknown'}`;
}

function normalizeEmailForKey(email) {
    if (typeof email !== 'string') return null;
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    // Basic sanity limit to avoid unbounded key size / abuse.
    if (normalized.length > 254) return null;
    return normalized;
}

function authKeyGenerator(req) {
    const email = normalizeEmailForKey(req.body?.email);
    if (email) return `email:${email}`;
    return userAwareKeyGenerator(req);
}

// General API rate limiter - applies to most endpoints
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute per user (fallback to IP if anonymous)
    keyGenerator: userAwareKeyGenerator,
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/debug-log' || req.path === '/debug-ip';
    }
});

// Strict limiter for auth endpoints (login, register, password reset)
export const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 attempts per minute
    keyGenerator: authKeyGenerator,
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false // Count all requests
});

// Limiter for file uploads (images, voice messages)
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    keyGenerator: userAwareKeyGenerator,
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
    keyGenerator: userAwareKeyGenerator,
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
    keyGenerator: userAwareKeyGenerator,
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
    keyGenerator: userAwareKeyGenerator,
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
    keyGenerator: userAwareKeyGenerator,
    message: {
        error: 'Too many search requests, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});
