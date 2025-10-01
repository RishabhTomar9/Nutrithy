class ICEServerManager {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache
    this.defaultSTUNServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302'
    ];
  }

  async getICEServers() {
    try {
      const cacheKey = 'ice_servers';
      let iceServers = this.cache.get(cacheKey);
      
      if (!iceServers) {
        iceServers = await this.generateICEServers();
        this.cache.set(cacheKey, iceServers);
        // Auto-expire after 1 hour
        setTimeout(() => this.cache.delete(cacheKey), 3600000);
      }
      
      return iceServers;
    } catch (error) {
      console.error('Failed to get ICE servers:', error);
      return this.getFallbackICEServers();
    }
  }

  async generateICEServers() {
    const iceServers = [];
    
    // Add STUN servers
    const stunServers = process.env.STUN_SERVERS?.split(',') || this.defaultSTUNServers;
    stunServers.forEach(server => {
      iceServers.push({
        urls: server.trim(),
        username: undefined,
        credential: undefined
      });
    });

    // Add TURN server if configured
    if (process.env.TURN_SERVER_URL && process.env.TURN_SERVER_USERNAME && process.env.TURN_SERVER_PASSWORD) {
      iceServers.push({
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_SERVER_USERNAME,
        credential: process.env.TURN_SERVER_PASSWORD,
        credentialType: 'password'
      });
    } else {
      // Add public TURN servers as fallback
      iceServers.push(...this.getPublicTURNServers());
    }

    return iceServers;
  }

  getPublicTURNServers() {
    return [
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];
  }

  getFallbackICEServers() {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];
  }

  // Generate time-limited credentials for TURN server
  generateTURNCredentials(username, sharedSecret, ttl = 24 * 3600) {
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    const turnUsername = `${timestamp}:${username}`;
    const hmac = require('crypto').createHmac('sha1', sharedSecret);
    hmac.update(turnUsername);
    const turnPassword = hmac.digest('base64');
    
    return {
      username: turnUsername,
      credential: turnPassword
    };
  }

  // Test ICE server connectivity
  async testICEServers(iceServers) {
    const results = [];
    
    for (const server of iceServers) {
      try {
        const result = await this.testSingleICEServer(server);
        results.push({
          ...server,
          status: result ? 'online' : 'offline',
          lastTested: new Date()
        });
      } catch (error) {
        results.push({
          ...server,
          status: 'error',
          error: error.message,
          lastTested: new Date()
        });
      }
    }
    
    return results;
  }

  async testSingleICEServer(server) {
    return new Promise((resolve) => {
      // Simplified test - in production you'd want more sophisticated testing
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);
      
      // For STUN servers, we assume they're available
      if (server.urls.startsWith('stun:')) {
        clearTimeout(timeout);
        resolve(true);
        return;
      }
      
      // For TURN servers, you'd need to implement actual connectivity testing
      clearTimeout(timeout);
      resolve(true); // Assume available for now
    });
  }

  // Configure WebRTC peer connection settings
  getPeerConnectionConfig() {
    return {
      iceServers: this.cache.get('ice_servers') || this.getFallbackICEServers(),
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-compat',
      rtcpMuxPolicy: 'require',
      sdpSemantics: 'unified-plan'
    };
  }

  // Get optimized ICE servers based on client location/network
  async getOptimizedICEServers(clientIP, userAgent) {
    try {
      const baseServers = await this.getICEServers();
      
      // Add region-specific optimizations here
      // For now, return base servers
      return baseServers;
    } catch (error) {
      console.error('Failed to get optimized ICE servers:', error);
      return this.getFallbackICEServers();
    }
  }

  // Monitor ICE server performance
  recordICEServerPerformance(serverId, connectionTime, success) {
    const key = `ice_perf_${serverId}`;
    let stats = this.cache.get(key) || { 
      attempts: 0, 
      successes: 0, 
      avgConnectionTime: 0,
      lastUpdate: new Date()
    };
    
    stats.attempts++;
    if (success) {
      stats.successes++;
      stats.avgConnectionTime = (stats.avgConnectionTime + connectionTime) / 2;
    }
    stats.lastUpdate = new Date();
    
    this.cache.set(key, stats, 7 * 24 * 3600); // Keep for 7 days
  }

  getICEServerStats() {
    const keys = this.cache.keys().filter(key => key.startsWith('ice_perf_'));
    const stats = {};
    
    keys.forEach(key => {
      const serverId = key.replace('ice_perf_', '');
      stats[serverId] = this.cache.get(key);
    });
    
    return stats;
  }

  clearCache() {
    this.cache.flushAll();
  }
}

module.exports = ICEServerManager;
