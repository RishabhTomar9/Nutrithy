const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.secretKey = process.env.ENCRYPTION_KEY || this.generateDefaultKey();
    this.sessionKeys = new Map();
  }

  generateDefaultKey() {
    console.warn('⚠️  Using default encryption key. Set ENCRYPTION_KEY in production!');
    return 'default-secret-key-32-characters';
  }

  generateSessionKeys() {
    const sessionKey = crypto.randomBytes(32);
    const sessionId = 'session-' + Date.now();
    
    const keys = {
      sessionId,
      sessionKey: sessionKey.toString('hex'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    
    this.sessionKeys.set(sessionId, keys);
    return keys;
  }

  encryptData(text, sessionId = null) {
    try {
      if (!text) return text;
      
      const key = this.secretKey.slice(0, 32).padEnd(32, '0');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        sessionId
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Return original text as fallback
    }
  }

  decryptData(encryptedData, sessionId = null) {
    try {
      if (!encryptedData || typeof encryptedData === 'string') return encryptedData;
      
      const { encrypted, iv } = encryptedData;
      const key = this.secretKey.slice(0, 32).padEnd(32, '0');
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Return original data as fallback
    }
  }

  encryptSignal(signal, socketId) {
    try {
      const signalData = JSON.stringify(signal);
      const hash = crypto.createHash('sha256').update(socketId + Date.now()).digest('hex');
      
      return this.encryptData(signalData + '|' + hash);
    } catch (error) {
      console.error('Signal encryption error:', error);
      return signal; // Fallback to unencrypted for development
    }
  }

  decryptSignal(encryptedSignal, socketId) {
    try {
      const decryptedData = this.decryptData(encryptedSignal);
      const [signalData, hash] = decryptedData.split('|');
      
      // Verify integrity (basic check)
      if (!signalData || !hash) {
        throw new Error('Invalid signal format');
      }
      
      return JSON.parse(signalData);
    } catch (error) {
      console.error('Signal decryption error:', error);
      return encryptedSignal; // Fallback for development
    }
  }

  encryptMessage(message, roomId) {
    try {
      const timestamp = Date.now();
      const messageData = JSON.stringify({
        content: message,
        timestamp,
        roomId,
        integrity: crypto.createHash('md5').update(message + timestamp).digest('hex')
      });
      
      return this.encryptData(messageData);
    } catch (error) {
      console.error('Message encryption error:', error);
      return { encrypted: message, iv: '', authTag: '' }; // Fallback
    }
  }

  decryptMessage(encryptedMessage) {
    try {
      const decryptedData = this.decryptData(encryptedMessage);
      const messageData = JSON.parse(decryptedData);
      
      // Verify integrity
      const expectedIntegrity = crypto.createHash('md5')
        .update(messageData.content + messageData.timestamp)
        .digest('hex');
      
      if (messageData.integrity !== expectedIntegrity) {
        throw new Error('Message integrity check failed');
      }
      
      return messageData;
    } catch (error) {
      console.error('Message decryption error:', error);
      return { content: 'Decryption failed', timestamp: Date.now() };
    }
  }

  encryptForClient(data, clientId) {
    try {
      // Create client-specific encryption
      const clientKey = crypto.createHash('sha256')
        .update(this.secretKey + clientId)
        .digest('hex');
      
      const dataString = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', Buffer.from(clientKey, 'hex'));
      
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        data: encrypted,
        iv: iv.toString('hex'),
        clientId
      };
    } catch (error) {
      console.error('Client encryption error:', error);
      return data; // Fallback
    }
  }

  generateRoomKey(roomId) {
    const roomKey = crypto.createHash('sha256')
      .update(this.secretKey + roomId + Date.now())
      .digest('hex');
    
    return roomKey;
  }

  cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessionKeys) {
      if (session.expiresAt < now) {
        this.sessionKeys.delete(sessionId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  // WebRTC DTLS-SRTP key generation
  generateDTLSFingerprint() {
    const cert = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    
    const fingerprint = crypto.createHash('sha256')
      .update(cert.publicKey)
      .digest('hex')
      .match(/.{2}/g)
      .join(':')
      .toLowerCase();
    
    return {
      fingerprint,
      algorithm: 'sha-256'
    };
  }

  // Generate secure room tokens
  generateRoomToken(roomId, userId, expirationHours = 24) {
    const payload = {
      roomId,
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (expirationHours * 3600)
    };
    
    const token = crypto.createHmac('sha256', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `${Buffer.from(JSON.stringify(payload)).toString('base64')}.${token}`;
  }

  verifyRoomToken(token) {
    try {
      const [payloadB64, signature] = token.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
      
      const expectedSignature = crypto.createHmac('sha256', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }
      
      return payload;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }
}

module.exports = EncryptionService;
