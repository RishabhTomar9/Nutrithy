const winston = require('winston');
const path = require('path');
const fs = require('fs');

class Logger {
  constructor() {
    // Ensure logs directory exists
    const logDir = process.env.LOG_DIR || './logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Define custom format
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        if (stack) {
          return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    );

    // Create the logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports: [
        // File transport for all logs
        new winston.transports.File({
          filename: path.join(logDir, 'app.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),
        
        // Separate file for errors
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),
        
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              const coloredLevel = level.padEnd(15); // Pad for alignment
              if (stack) {
                return `${timestamp} ${coloredLevel} ${message}\n${stack}`;
              }
              return `${timestamp} ${coloredLevel} ${message}`;
            })
          )
        })
      ],
      
      // Handle exceptions and rejections
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'exceptions.log')
        })
      ],
      
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(logDir, 'rejections.log')
        })
      ]
    });

    // Remove console transport in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.remove(this.logger.transports.find(t => t.name === 'console'));
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, error = null, meta = {}) {
    if (error instanceof Error) {
      this.logger.error(message, { ...meta, error: error.message, stack: error.stack });
    } else {
      this.logger.error(message, { ...meta, error });
    }
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  // Special methods for video call logging
  logVideoCallStart(roomId, userId, clientIP) {
    this.info('Video call started', {
      event: 'video_call_start',
      roomId,
      userId,
      clientIP,
      timestamp: new Date().toISOString()
    });
  }

  logVideoCallEnd(roomId, userId, duration) {
    this.info('Video call ended', {
      event: 'video_call_end',
      roomId,
      userId,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  logConnectionIssue(roomId, userId, issue) {
    this.warn('Connection issue detected', {
      event: 'connection_issue',
      roomId,
      userId,
      issue,
      timestamp: new Date().toISOString()
    });
  }

  logSecurityIncident(roomId, userId, incident, severity = 'medium') {
    this.error('Security incident detected', null, {
      event: 'security_incident',
      roomId,
      userId,
      incident,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  logPerformanceMetric(metric, value, context = {}) {
    this.info('Performance metric', {
      event: 'performance_metric',
      metric,
      value,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Log WebRTC signaling events
  logWebRTCSignal(from, to, signalType) {
    this.debug('WebRTC signal', {
      event: 'webrtc_signal',
      from,
      to,
      signalType,
      timestamp: new Date().toISOString()
    });
  }

  // Log room events
  logRoomEvent(roomId, event, details = {}) {
    this.info(`Room event: ${event}`, {
      event: 'room_event',
      roomId,
      eventType: event,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Get recent logs (for admin interface)
  async getRecentLogs(limit = 100, level = 'info') {
    return new Promise((resolve, reject) => {
      const options = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        until: new Date(),
        limit,
        start: 0,
        order: 'desc',
        fields: ['timestamp', 'level', 'message', 'meta']
      };

      this.logger.query(options, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Create child logger with context
  child(context) {
    return {
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      error: (message, error = null, meta = {}) => this.error(message, error, { ...context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta }),
      verbose: (message, meta = {}) => this.verbose(message, { ...context, ...meta })
    };
  }
}

module.exports = Logger;
