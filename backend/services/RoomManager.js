const crypto = require('crypto');
const Room = require('../models/Room');

class SecureRoom {
  constructor(id, config = {}) {
    this.id = id;
    this.name = config.name || `Room ${id.substring(0, 8)}`;
    this.host = null;
    this.participants = new Map();
    this.chatHistory = [];
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.maxParticipants = config.maxParticipants || 10;
    this.isPrivate = config.isPrivate || false;
    this.settings = {
      allowScreenShare: true,
      allowChat: true,
      requireApproval: true,
      recordingEnabled: false,
      maxDuration: 4 * 60 * 60 * 1000, // 4 hours
      ...config.settings
    };
    this.analytics = {
      totalJoins: 0,
      totalLeaves: 0,
      peakParticipants: 0,
      totalChatMessages: 0,
      connectionIssues: 0
    };
    this.securityFlags = {
      suspiciousActivity: false,
      ipWhitelist: config.ipWhitelist || [],
      maxConnectionsPerIP: 3
    };
  }

  addParticipant(socketId, participantData) {
    try {
      if (this.isFull()) {
        throw new Error('Room is full');
      }

      if (this.participants.has(socketId)) {
        throw new Error('Participant already in room');
      }

      const participant = {
        socketId,
        joinedAt: new Date(),
        ...participantData,
        mediaState: {
          audio: true,
          video: true,
          screenShare: false
        },
        connectionQuality: 'good',
        lastSeen: new Date()
      };

      this.participants.set(socketId, participant);
      
      if (!this.host) {
        this.host = socketId;
        participant.isHost = true;
      }

      this.analytics.totalJoins++;
      this.analytics.peakParticipants = Math.max(
        this.analytics.peakParticipants,
        this.participants.size
      );
      
      this.updateLastActivity();
      
      return participant;
    } catch (error) {
      throw error;
    }
  }

  async removeParticipant(socketId) {
    try {
      const participant = this.participants.get(socketId);
      if (!participant) return null;

      this.participants.delete(socketId);
      this.analytics.totalLeaves++;

      // Transfer host if necessary
      if (this.host === socketId && this.participants.size > 0) {
        const newHost = this.participants.keys().next().value;
        this.host = newHost;
        const newHostParticipant = this.participants.get(newHost);
        if (newHostParticipant) {
          newHostParticipant.isHost = true;
        }
      }

      this.updateLastActivity();
      return participant;
    } catch (error) {
      throw error;
    }
  }

  getParticipant(socketId) {
    return this.participants.get(socketId);
  }

  getParticipants() {
    return Array.from(this.participants.entries()).map(([socketId, participant]) => ({
      socketId,
      ...participant
    }));
  }

  updateParticipantMedia(socketId, mediaType, enabled) {
    const participant = this.participants.get(socketId);
    if (participant) {
      participant.mediaState[mediaType] = enabled;
      participant.lastSeen = new Date();
      this.updateLastActivity();
    }
  }

  updateConnectionQuality(socketId, quality, stats = {}) {
    const participant = this.participants.get(socketId);
    if (participant) {
      participant.connectionQuality = quality;
      participant.connectionStats = {
        ...participant.connectionStats,
        ...stats,
        lastUpdate: new Date()
      };
      
      if (quality === 'poor') {
        this.analytics.connectionIssues++;
      }
      
      participant.lastSeen = new Date();
      this.updateLastActivity();
    }
  }

  addChatMessage(messageData) {
    try {
        const chatData = {
          id: messageData.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        ...messageData,
        timestamp: new Date()
      };

      this.chatHistory.push(message);
      this.analytics.totalChatMessages++;
      this.updateLastActivity();

      // Keep only last 100 messages
      if (this.chatHistory.length > 100) {
        this.chatHistory = this.chatHistory.slice(-100);
      }

      return message;
    } catch (error) {
      throw error;
    }
  }

  getChatHistory(limit = 50) {
    return this.chatHistory.slice(-limit);
  }

  isFull() {
    return this.participants.size >= this.maxParticipants;
  }

  isEmpty() {
    return this.participants.size === 0;
  }

  isExpired() {
    const now = new Date();
    const maxAge = this.settings.maxDuration;
    const inactiveTime = now - this.lastActivity;
    
    return (
      (now - this.createdAt > maxAge) ||
      (inactiveTime > 30 * 60 * 1000 && this.isEmpty()) // 30 minutes inactive and empty
    );
  }

  updateLastActivity() {
    this.lastActivity = new Date();
  }

  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      participantCount: this.participants.size,
      maxParticipants: this.maxParticipants,
      isPrivate: this.isPrivate,
      createdAt: this.createdAt,
      settings: {
        allowScreenShare: this.settings.allowScreenShare,
        allowChat: this.settings.allowChat,
        requireApproval: this.settings.requireApproval
      }
    };
  }

  getAnalytics() {
    return {
      ...this.analytics,
      currentParticipants: this.participants.size,
      duration: new Date() - this.createdAt,
      lastActivity: this.lastActivity
    };
  }

  // Security methods
  flagSuspiciousActivity(reason, socketId) {
    this.securityFlags.suspiciousActivity = true;
    this.securityFlags.lastIncident = {
      reason,
      socketId,
      timestamp: new Date()
    };
  }

  checkIPLimit(ip) {
    const participantIPs = Array.from(this.participants.values())
      .map(p => p.ip)
      .filter(pIp => pIp === ip);
    
    return participantIPs.length < this.securityFlags.maxConnectionsPerIP;
  }

  isIPWhitelisted(ip) {
    if (this.securityFlags.ipWhitelist.length === 0) return true;
    return this.securityFlags.ipWhitelist.includes(ip);
  }
}

class RoomManager {
  constructor(logger) {
    this.rooms = new Map();
    this.logger = logger;
    this.roomHistory = new Map(); // Keep basic history for analytics
  }

  async createRoom(roomId, config = {}) {
    try {
      if (this.rooms.has(roomId)) {
        throw new Error('Room already exists');
      }

      const room = new SecureRoom(roomId, config);
      this.rooms.set(roomId, room);

      // Persist to database
      await Room.create({
        roomID: roomId,
        name: room.name,
        createdAt: room.createdAt,
        maxParticipants: room.maxParticipants,
        isPrivate: room.isPrivate,
        settings: room.settings
      });

      this.logger.info(`Room created: ${roomId}`);
      return room;
    } catch (error) {
      this.logger.error(`Failed to create room ${roomId}:`, error);
      throw error;
    }
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  getPublicRooms() {
    return Array.from(this.rooms.values())
      .filter(room => !room.isPrivate)
      .map(room => room.getPublicInfo());
  }

  async removeRoom(roomId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) return null;

      // Store room data in history for analytics
      this.roomHistory.set(roomId, {
        ...room.getAnalytics(),
        endedAt: new Date()
      });

      this.rooms.delete(roomId);

      // Remove from database
      await Room.deleteOne({ roomID: roomId });

      this.logger.info(`Room removed: ${roomId}`);
      return room;
    } catch (error) {
      this.logger.error(`Failed to remove room ${roomId}:`, error);
      throw error;
    }
  }

  cleanupExpiredRooms() {
    let cleanedCount = 0;
    
    for (const [roomId, room] of this.rooms) {
      if (room.isExpired()) {
        this.removeRoom(roomId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Analytics and monitoring
  getGlobalAnalytics() {
    const activeRooms = Array.from(this.rooms.values());
    const historicalRooms = Array.from(this.roomHistory.values());
    
    return {
      activeRooms: activeRooms.length,
      totalParticipants: activeRooms.reduce((sum, room) => sum + room.participants.size, 0),
      averageRoomSize: activeRooms.length > 0 ? 
        activeRooms.reduce((sum, room) => sum + room.participants.size, 0) / activeRooms.length : 0,
      totalRoomsCreated: this.rooms.size + this.roomHistory.size,
      averageSessionDuration: historicalRooms.length > 0 ?
        historicalRooms.reduce((sum, room) => sum + room.duration, 0) / historicalRooms.length : 0,
      totalConnectionIssues: activeRooms.reduce((sum, room) => sum + room.analytics.connectionIssues, 0),
      lastUpdate: new Date()
    };
  }

  getRoomAnalytics(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      // Check historical data
      return this.roomHistory.get(roomId) || null;
    }
    
    return room.getAnalytics();
  }

  // Security monitoring
  getSecurityReport() {
    const activeRooms = Array.from(this.rooms.values());
    const suspiciousRooms = activeRooms.filter(room => room.securityFlags.suspiciousActivity);
    
    return {
      totalRooms: activeRooms.length,
      suspiciousRooms: suspiciousRooms.length,
      incidents: suspiciousRooms.map(room => ({
        roomId: room.id,
        incident: room.securityFlags.lastIncident
      })),
      timestamp: new Date()
    };
  }

  // Room search and discovery
  searchRooms(query, includePrivate = false) {
    const rooms = Array.from(this.rooms.values());
    const filteredRooms = rooms.filter(room => {
      if (!includePrivate && room.isPrivate) return false;
      return room.name.toLowerCase().includes(query.toLowerCase());
    });

    return filteredRooms.map(room => room.getPublicInfo());
  }

  // Backup and restore (for Redis integration)
  async saveToRedis(redisClient) {
    try {
      const roomsData = {};
      for (const [roomId, room] of this.rooms) {
        roomsData[roomId] = {
          id: room.id,
          name: room.name,
          host: room.host,
          participants: Array.from(room.participants.entries()),
          chatHistory: room.chatHistory.slice(-20), // Keep last 20 messages
          createdAt: room.createdAt,
          settings: room.settings,
          analytics: room.analytics
        };
      }

      await redisClient.set('video_call_rooms', JSON.stringify(roomsData), 'EX', 3600);
      this.logger.info('Rooms data saved to Redis');
    } catch (error) {
      this.logger.error('Failed to save rooms to Redis:', error);
    }
  }

  async loadFromRedis(redisClient) {
    try {
      const roomsData = await redisClient.get('video_call_rooms');
      if (!roomsData) return;

      const parsedData = JSON.parse(roomsData);
      for (const [roomId, roomData] of Object.entries(parsedData)) {
        const room = new SecureRoom(roomId, {
          name: roomData.name,
          maxParticipants: roomData.settings.maxParticipants,
          isPrivate: roomData.settings.isPrivate,
          settings: roomData.settings
        });

        room.host = roomData.host;
        room.participants = new Map(roomData.participants);
        room.chatHistory = roomData.chatHistory;
        room.createdAt = new Date(roomData.createdAt);
        room.analytics = roomData.analytics;

        this.rooms.set(roomId, room);
      }

      this.logger.info(`Restored ${this.rooms.size} rooms from Redis`);
    } catch (error) {
      this.logger.error('Failed to load rooms from Redis:', error);
    }
  }
}

module.exports = { RoomManager, SecureRoom };
