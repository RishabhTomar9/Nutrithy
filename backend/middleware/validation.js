const { body, param, query, validationResult } = require('express-validator');
const Logger = require('../utils/logger');

const logger = new Logger();

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      ip: req.ip,
      path: req.path
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Socket data validation middleware
const validateRoomData = (socket, next) => {
  try {
    // Basic socket validation
    if (!socket.handshake.address) {
      return next(new Error('Invalid client connection'));
    }

    // Validate user agent if needed for security
    const userAgent = socket.handshake.headers['user-agent'];
    if (!userAgent || userAgent.length < 5) {
      logger.warn('Suspicious connection - invalid user agent', {
        socketId: socket.id,
        ip: socket.handshake.address,
        userAgent
      });
    }

    next();
  } catch (error) {
    logger.error('Socket validation error', error, {
      socketId: socket.id,
      ip: socket.handshake.address
    });
    next(new Error('Validation failed'));
  }
};

// Room creation validation
const validateRoomCreation = [
  body('roomName')
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Room name must be 3-50 characters and contain only letters, numbers, spaces, hyphens, and underscores'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Max participants must be between 2 and 50'),
  
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  
  handleValidationErrors
];

// Room join validation
const validateRoomJoin = [
  param('roomId')
    .isUUID(4)
    .withMessage('Invalid room ID format'),
  
  handleValidationErrors
];

// Message validation
const validateChatMessage = (data) => {
  const errors = [];
  
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required and must be a string');
  }
  
  if (data.message && data.message.length > 500) {
    errors.push('Message must be less than 500 characters');
  }
  
  if (data.message && data.message.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  // Check for inappropriate content (basic)
  if (data.message && containsInappropriateContent(data.message)) {
    errors.push('Message contains inappropriate content');
  }
  
  return errors;
};

// User data validation for socket events
const validateUserData = (userData) => {
  const errors = [];
  
  if (!userData.displayName || typeof userData.displayName !== 'string') {
    errors.push('Display name is required and must be a string');
  }
  
  if (userData.displayName && userData.displayName.length > 30) {
    errors.push('Display name must be less than 30 characters');
  }
  
  if (userData.displayName && userData.displayName.trim().length === 0) {
    errors.push('Display name cannot be empty');
  }
  
  // Validate display name format
  if (userData.displayName && !userData.displayName.match(/^[a-zA-Z0-9\s\-_]+$/)) {
    errors.push('Display name can only contain letters, numbers, spaces, hyphens, and underscores');
  }
  
  return errors;
};

// Room ID validation
const validateRoomId = (roomId) => {
  const errors = [];
  
  if (!roomId || typeof roomId !== 'string') {
    errors.push('Room ID is required and must be a string');
  }
  
  if (roomId && roomId.length !== 36) {
    errors.push('Invalid room ID format');
  }
  
  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (roomId && !uuidRegex.test(roomId)) {
    errors.push('Room ID must be a valid UUID v4');
  }
  
  return errors;
};

// WebRTC signal validation
const validateWebRTCSignal = (signalData) => {
  const errors = [];
  
  if (!signalData.to || typeof signalData.to !== 'string') {
    errors.push('Target socket ID is required');
  }
  
  if (!signalData.signal || typeof signalData.signal !== 'object') {
    errors.push('Signal data is required and must be an object');
  }
  
  if (!signalData.type || !['offer', 'answer', 'candidate'].includes(signalData.type)) {
    errors.push('Signal type must be offer, answer, or candidate');
  }
  
  // Validate signal structure based on type
  if (signalData.signal) {
    switch (signalData.type) {
      case 'offer':
      case 'answer':
        if (!signalData.signal.sdp || typeof signalData.signal.sdp !== 'string') {
          errors.push('SDP is required for offer/answer signals');
        }
        if (!signalData.signal.type || typeof signalData.signal.type !== 'string') {
          errors.push('Signal type is required for offer/answer signals');
        }
        break;
      case 'candidate':
        if (signalData.signal.candidate === undefined) {
          errors.push('Candidate is required for candidate signals');
        }
        break;
    }
  }
  
  return errors;
};

// Media control validation
const validateMediaControl = (mediaData) => {
  const errors = [];
  
  if (!mediaData.type || !['audio', 'video'].includes(mediaData.type)) {
    errors.push('Media type must be audio or video');
  }
  
  if (typeof mediaData.enabled !== 'boolean') {
    errors.push('Media enabled state must be a boolean');
  }
  
  return errors;
};

// Connection quality validation
const validateConnectionQuality = (qualityData) => {
  const errors = [];
  
  if (!qualityData.quality || !['excellent', 'good', 'poor'].includes(qualityData.quality)) {
    errors.push('Quality must be excellent, good, or poor');
  }
  
  if (qualityData.stats && typeof qualityData.stats !== 'object') {
    errors.push('Stats must be an object');
  }
  
  return errors;
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
};

// Check for inappropriate content (basic implementation)
const containsInappropriateContent = (text) => {
  const inappropriateWords = [
    // Add your list of inappropriate words here
    'spam', 'scam', 'hack'
  ];
  
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
};

// Socket event validation wrapper
const validateSocketEvent = (eventName, validator) => {
  return (socket, data, callback) => {
    try {
      const errors = validator(data);
      
      if (errors.length > 0) {
        logger.warn(`Socket event validation failed: ${eventName}`, {
          socketId: socket.id,
          errors,
          data: data
        });
        
        if (callback) {
          callback({ error: 'Validation failed', details: errors });
        } else {
          socket.emit('error', { 
            event: eventName,
            error: 'Validation failed', 
            details: errors 
          });
        }
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Socket validation error for ${eventName}`, error, {
        socketId: socket.id
      });
      
      if (callback) {
        callback({ error: 'Validation error' });
      } else {
        socket.emit('error', { 
          event: eventName,
          error: 'Validation error' 
        });
      }
      return false;
    }
  };
};

// IP address validation
const validateIPAddress = (ip) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// File upload validation (for profile pictures, etc.)
const validateFileUpload = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return errors;
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size must be less than 5MB');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('File must be a valid image (JPEG, PNG, GIF, or WebP)');
  }
  
  return errors;
};

module.exports = {
  validateRoomData,
  validateRoomCreation,
  validateRoomJoin,
  validateChatMessage,
  validateUserData,
  validateRoomId,
  validateWebRTCSignal,
  validateMediaControl,
  validateConnectionQuality,
  validateSocketEvent,
  validateIPAddress,
  validateFileUpload,
  sanitizeInput,
  handleValidationErrors
};
