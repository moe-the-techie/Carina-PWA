import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// TODO: add logic for admin access

// Function to verify the JWT token (for login)
export async function verifyToken(token) {
  return new Promise ((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      return resolve(decoded);
    });
  });
};

export async function protect(req, res, next) {
  let token;

  try {
    // Check for the token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify the token
    const decoded = await verifyToken(token);

    // Get the user (and check if they exist)
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, invalid token' }); // Or a more specific message
    }

    req.user = user; // Store user in request
    next(); // Move to the next middleware/route
  } catch (error) {
    // Handle all errors (token verification, user lookup) in one place
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
