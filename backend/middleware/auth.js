import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import cache, { CacheKeys, CacheTTL } from '../config/cache.js';

// JWT verification - synchronous for better performance
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Extract and verify token from request
 * @returns {{ decoded: object } | { error: string, status: number }}
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: '401: Not authorized, no token', status: 401 };
  }

  const token = authHeader.slice(7); // More efficient than split
  
  try {
    const decoded = verifyToken(token);
    return { decoded };
  } catch (error) {
    return { error: '401: Not authorized, token failed', status: 401 };
  }
}

/**
 * Get user with caching for repeated requests
 * Uses short TTL to balance freshness vs performance
 */
async function getCachedUser(userId) {
  const cacheKey = CacheKeys.userById(userId);
  
  return cache.getOrSet(cacheKey, async () => {
    const user = await User.findById(userId)
      .select('-password')
      .lean(); // Use lean() for read-only operations - 3-5x faster
    return user;
  }, CacheTTL.SHORT);
}

/**
 * Core authentication middleware - shared logic
 * @param {boolean} requireAdmin - Whether to require admin role
 */
function createAuthMiddleware(requireAdmin = false) {
  return async function(req, res, next) {
    try {
      // Extract and verify token
      const tokenResult = extractToken(req);
      if (tokenResult.error) {
        return res.status(tokenResult.status).json({ error: tokenResult.error });
      }

      // Get user with caching
      const user = await getCachedUser(tokenResult.decoded.userId);
      
      if (!user) {
        return res.status(401).json({ error: '401: Not authorized, invalid token' });
      }

      // Check admin requirement
      if (requireAdmin && user.role !== 'admin') {
        return res.status(403).json({ error: '403: Access denied, admin privileges required' });
      }

      // Attach user to request (convert lean object back for compatibility)
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ error: '401: Not authorized, token failed' });
    }
  };
}

// Export middleware functions
export const protect = createAuthMiddleware(false);
export const adminOnly = createAuthMiddleware(true);

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles
 */
function roleOnly(allowedRoles = []) {
  return async function(req, res, next) {
    try {
      const tokenResult = extractToken(req);
      if (tokenResult.error) {
        return res.status(tokenResult.status).json({ error: tokenResult.error });
      }

      const user = await getCachedUser(tokenResult.decoded.userId);

      if (!user) {
        return res.status(401).json({ error: '401: Not authorized, invalid token' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: '403: Access denied' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ error: '401: Not authorized, token failed' });
    }
  };
}

export const chatAdminOnly = roleOnly(['admin', 'chat_admin']);

/**
 * Invalidate user cache when user data changes
 * Call this after user updates
 */
export function invalidateUserCache(userId) {
  cache.delete(CacheKeys.userById(userId));
}
