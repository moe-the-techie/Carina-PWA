import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// TODO: add logic for admin access

// Function to verify the JWT token (for login)
export async function verifyToken(token) {
  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // Return the decoded payload
  } catch (error) {
    throw error; // Re-throw the error to be caught by the caller
  }
};

export async function protect(req, res, next) {
  let token;

  try {
    // Check for the token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: '401: Not authorized, no token' });
    }

    // Verify the token
    const decoded = await verifyToken(token);

    // Get the user (and check if they exist)
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: '401: Not authorized, invalid token' }); // Or a more specific message
    }

    req.user = user; // Store user in request
    next(); // Move to the next middleware/route
  } catch (error) {
    // Handle all errors (token verification, user lookup) in one place
    console.error(error);
    return res.status(401).json({ error: '401: Not authorized, token failed' });
  }
};

// Admin protection middleware
export async function adminOnly(req, res, next) {
  let token;

  try {
    // Check for the token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: '401: Not authorized, no token' });
    }

    // Verify the token
    const decoded = await verifyToken(token);

    // Get the user (and check if they exist)
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: '401: Not authorized, invalid token' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: '403: Access denied, admin privileges required' });
    }

    req.user = user; // Store user in request
    next(); // Move to the next middleware/route
  } catch (error) {
    // Handle all errors (token verification, user lookup) in one place
    console.error(error);
    return res.status(401).json({ error: '401: Not authorized, token failed' });
  }
};
