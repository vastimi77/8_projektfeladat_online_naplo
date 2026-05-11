const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Authentication middleware - verifies JWT token from Authorization header
 * Expected format: "Bearer <token>"
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    // Check Bearer scheme
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Ensure required fields exist in token
      if (!decoded.id || !decoded.username) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }

      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Generate JWT token for authenticated user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

module.exports = { authMiddleware, generateToken };
