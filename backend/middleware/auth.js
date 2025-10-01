const jwt = require('jsonwebtoken');
const Logger = require('../utils/logger');

const logger = new Logger();

// Socket authentication middleware
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      logger.warn('Socket connection attempted without token', {
        socketId: socket.id,
        ip: socket.handshake.address
      });
      return next(new Error('Authentication token required'));
    }

    // For development, allow basic authentication
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      socket.user = {
        id: socket.id,
        displayName: 'Developer User',
        role: 'user'
      };
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    socket.user = decoded;
    
    logger.info('Socket authenticated successfully', {
      socketId: socket.id,
      userId: decoded.id,
      ip: socket.handshake.address
    });
    
    next();
  } catch (error) {
    logger.error('Socket authentication failed', error, {
      socketId: socket.id,
      ip: socket.handshake.address
    });
    next(new Error('Authentication failed'));
  }
};

// HTTP request authentication middleware
const authenticateRequest = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // For development, allow basic authentication
    if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
      req.user = {
        id: 'dev-user',
        displayName: 'Developer User',
        role: 'user'
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    
    logger.info('HTTP request authenticated successfully', {
      userId: decoded.id,
      ip: req.ip,
      path: req.path
    });
    
    next();
  } catch (error) {
    logger.error('HTTP authentication failed', error, {
      ip: req.ip,
      path: req.path
    });
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization middleware
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        requiredRole,
        userRole: req.user.role,
        ip: req.ip,
        path: req.path
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Rate limiting per user
const userRateLimit = new Map();

const rateLimitByUser = (maxRequests = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!userRateLimit.has(userId)) {
      userRateLimit.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userLimit = userRateLimit.get(userId);
    
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        userId,
        ip: req.ip,
        count: userLimit.count,
        maxRequests
      });
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }
    
    userLimit.count++;
    next();
  };
};

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id || user.uid,
    displayName: user.displayName,
    email: user.email,
    role: user.role || 'user'
  };

  const accessToken = jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  const refreshToken = jwt.sign(
    { id: payload.id },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Socket IP whitelist check
const checkIPWhitelist = (allowedIPs = []) => {
  return (socket, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = socket.handshake.address;
    const normalizedIP = clientIP.replace('::ffff:', ''); // Remove IPv4-mapped IPv6 prefix
    
    if (!allowedIPs.includes(normalizedIP) && !allowedIPs.includes(clientIP)) {
      logger.warn('Connection blocked - IP not whitelisted', {
        ip: clientIP,
        socketId: socket.id
      });
      return next(new Error('IP address not allowed'));
    }
    
    next();
  };
};

// Socket connection throttling
const connectionTracker = new Map();

const throttleConnections = (maxConnectionsPerIP = 5, windowMs = 60000) => {
  return (socket, next) => {
    const clientIP = socket.handshake.address;
    const now = Date.now();
    
    // Clean up expired entries
    for (const [ip, data] of connectionTracker) {
      if (now > data.resetTime) {
        connectionTracker.delete(ip);
      }
    }
    
    if (!connectionTracker.has(clientIP)) {
      connectionTracker.set(clientIP, { 
        count: 1, 
        resetTime: now + windowMs,
        sockets: new Set([socket.id])
      });
      return next();
    }
    
    const ipData = connectionTracker.get(clientIP);
    
    if (now > ipData.resetTime) {
      ipData.count = 1;
      ipData.resetTime = now + windowMs;
      ipData.sockets.clear();
      ipData.sockets.add(socket.id);
      return next();
    }
    
    if (ipData.count >= maxConnectionsPerIP) {
      logger.warn('Connection throttled - too many connections from IP', {
        ip: clientIP,
        count: ipData.count,
        maxConnections: maxConnectionsPerIP
      });
      return next(new Error('Too many connections from this IP'));
    }
    
    ipData.count++;
    ipData.sockets.add(socket.id);
    
    // Handle socket disconnection
    socket.on('disconnect', () => {
      const ipData = connectionTracker.get(clientIP);
      if (ipData) {
        ipData.sockets.delete(socket.id);
        if (ipData.sockets.size === 0) {
          ipData.count = 0;
        }
      }
    });
    
    next();
  };
};

module.exports = {
  authenticateSocket,
  authenticateRequest,
  authorizeRole,
  rateLimitByUser,
  generateTokens,
  verifyRefreshToken,
  checkIPWhitelist,
  throttleConnections
};
