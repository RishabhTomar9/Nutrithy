const Room = require("../models/Room");
const CallHistory = require("../models/CallHistory");

// Simple services for enhanced functionality
class SimpleLogger {
  info(msg, data) { console.log('[INFO]', msg, data || ''); }
  error(msg, err, data) { console.error('[ERROR]', msg, err?.message || err, data || ''); }
  warn(msg, data) { console.warn('[WARN]', msg, data || ''); }
  debug(msg, data) { console.log('[DEBUG]', msg, data || ''); }
  logRoomEvent(roomId, event, details) { this.info(`Room ${roomId}: ${event}`, details); }
  logVideoCallStart(roomId, userId, ip) { this.info(`Video call started in ${roomId} by ${userId} from ${ip}`); }
  logVideoCallEnd(roomId, userId, duration) { this.info(`Video call ended in ${roomId} by ${userId}, duration: ${duration}ms`); }
  logWebRTCSignal(from, to, type) { this.debug(`WebRTC ${type} signal from ${from} to ${to}`); }
  logConnectionIssue(roomId, userId, issue) { this.warn(`Connection issue in ${roomId} for ${userId}: ${issue}`); }
  logSecurityIncident(roomId, userId, incident) { this.error(`Security incident in ${roomId} for ${userId}: ${incident}`); }
}

const logger = new SimpleLogger();

// Simple validation functions
const validateUserData = (user) => {
  if (!user || !user.displayName) return ['Display name is required'];
  return [];
};

const validateRoomId = (roomId) => {
  if (!roomId || typeof roomId !== 'string') return ['Room ID is required'];
  return [];
};

const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return ['Phone number is required'];
  }
  
  // Remove spaces, parentheses, and dashes for validation
  const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
  
  // Basic validation: should be digits, optionally starting with +
  if (!/^[+]?[1-9]\d{6,14}$/.test(cleanPhone)) {
    return ['Invalid phone number format'];
  }
  
  return [];
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim().substring(0, 1000);
};

const generateUniqueId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const rooms = {}; // roomID -> room data
const phoneToRoom = {}; // phoneNumber -> roomID mapping
const socketToUser = {}; // socketID -> user data
const socketToPhone = {}; // socketID -> phone number mapping

module.exports = (io) => {
  io.on("connection", (socket) => {
    logger.info(`🔌 User connected: ${socket.id}`);

    // Enhanced room check with validation
    socket.on("check-room", (roomID, cb) => {
      try {
        const errors = validateRoomId(roomID);
        if (errors.length > 0) {
          return cb({ error: 'Invalid room ID', details: errors });
        }
        
        const room = rooms[roomID];
        cb(!!room);
      } catch (error) {
        logger.error('Check room error', error, { socketId: socket.id });
        cb({ error: 'Check room failed' });
      }
    });

    // Phone number registration - like "going online" for calls
    socket.on("register-phone", async ({ phoneNumber, user }) => {
      try {
        // Validate phone number and user data
        const phoneErrors = validatePhoneNumber(phoneNumber);
        const userErrors = validateUserData(user);
        
        if (phoneErrors.length > 0 || userErrors.length > 0) {
          socket.emit('error', {
            message: 'Validation failed',
            phoneErrors,
            userErrors
          });
          return;
        }

        // Clean phone number for storage
        const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
        
        // Check if phone number is already registered by another active user
        const existingRoomID = phoneToRoom[cleanPhone];
        if (existingRoomID && rooms[existingRoomID]) {
          socket.emit('error', { message: 'Phone number already registered by another user' });
          return;
        }
        
        // Generate unique room ID for this phone number
        const roomID = `room_${cleanPhone}_${Date.now()}`;
        
        // Create room in memory
        rooms[roomID] = { 
          phoneNumber: cleanPhone,
          host: socket.id, 
          users: { [socket.id]: user },
          isAvailable: true,
          inCall: false,
          createdAt: new Date()
        };
        
        // Update mappings
        phoneToRoom[cleanPhone] = roomID;
        socketToUser[socket.id] = user;
        socketToPhone[socket.id] = cleanPhone;
        socket.join(roomID);
        
        // Save to database
        try {
          await Room.create({
            phoneNumber: cleanPhone,
            roomID,
            hostSocketId: socket.id,
            ownerName: user.displayName,
            isAvailable: true,
            inCall: false,
            users: [{ socketId: socket.id, ...user }],
            createdAt: new Date()
          });
        } catch (dbError) {
          logger.error('Database error when registering phone', dbError);
          // Continue without database - room exists in memory
        }
        
        logger.logRoomEvent(roomID, 'phone_registered', { phone: cleanPhone, user });
        console.log(`📞 Phone registered: ${cleanPhone} -> ${roomID}`);
        
        // Send success response
        socket.emit('phone-registered', { 
          phoneNumber: cleanPhone, 
          roomID, 
          status: 'available' 
        });
      } catch (error) {
        logger.error('Register phone error', error, { socketId: socket.id, phoneNumber });
        socket.emit('error', { message: 'Failed to register phone number' });
      }
    });

    // Initiate call to a phone number
    socket.on("call-phone", async ({ phoneNumber, user }) => {
      try {
        const phoneErrors = validatePhoneNumber(phoneNumber);
        const userErrors = validateUserData(user);
        
        if (phoneErrors.length > 0 || userErrors.length > 0) {
          socket.emit('error', {
            message: 'Validation failed',
            phoneErrors,
            userErrors
          });
          return;
        }

        // Clean phone number
        const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
        const targetRoomID = phoneToRoom[cleanPhone];
        const targetRoom = targetRoomID ? rooms[targetRoomID] : null;
        
        if (!targetRoom) {
          socket.emit('call-failed', { 
            message: 'Phone number not available or not registered',
            phoneNumber: cleanPhone
          });
          return;
        }
        
        if (!targetRoom.isAvailable || targetRoom.inCall) {
          socket.emit('call-failed', { 
            message: 'User is busy or unavailable',
            phoneNumber: cleanPhone
          });
          return;
        }
        
        socketToUser[socket.id] = user;
        
        // Send incoming call notification to target user
        io.to(targetRoom.host).emit("incoming-call", { 
          from: socket.id,
          callerPhone: socketToPhone[socket.id] || 'unknown',
          caller: {
            ...user,
            displayName: sanitizeInput(user.displayName)
          },
          timestamp: new Date()
        });
        
        // Set user as busy while calling
        const callerPhone = socketToPhone[socket.id];
        if (callerPhone && phoneToRoom[callerPhone]) {
          const callerRoom = rooms[phoneToRoom[callerPhone]];
          if (callerRoom) {
            callerRoom.isAvailable = false;
          }
        }
        
        // Send calling status to caller
        socket.emit('calling', { 
          phoneNumber: cleanPhone,
          targetUser: targetRoom.users[targetRoom.host]?.displayName || 'User'
        });
        
        logger.logRoomEvent(targetRoomID, 'incoming_call', { caller: socket.id, phone: cleanPhone });
      } catch (error) {
        logger.error('Call phone error', error, { socketId: socket.id, phoneNumber });
        socket.emit('error', { message: 'Call initiation failed' });
      }
    });

    // Answer or reject incoming call
    socket.on("answer-call", async ({ callerId, accepted }) => {
      try {
        const myPhone = socketToPhone[socket.id];
        const myRoomID = myPhone ? phoneToRoom[myPhone] : null;
        const myRoom = myRoomID ? rooms[myRoomID] : null;
        
        if (!myRoom || myRoom.host !== socket.id) {
          socket.emit('error', { message: 'Unauthorized or room not found' });
          return;
        }
        
        if (accepted) {
          // Accept the call - create a shared room for both users
          const callRoomID = `call_${Date.now()}_${socket.id}_${callerId}`;
          
          // Create call room
          rooms[callRoomID] = {
            isCallRoom: true,
            participants: [socket.id, callerId],
            host: socket.id, // The person who answered becomes host
            users: {},
            inCall: true,
            createdAt: new Date()
          };
          
          // Set both users as in call
          myRoom.inCall = true;
          myRoom.isAvailable = false;
          
          const callerPhone = socketToPhone[callerId];
          if (callerPhone && phoneToRoom[callerPhone]) {
            const callerRoom = rooms[phoneToRoom[callerPhone]];
            if (callerRoom) {
              callerRoom.inCall = true;
              callerRoom.isAvailable = false;
            }
          }
          
          // Join both participants to the call room
          socket.join(callRoomID);
          io.sockets.sockets.get(callerId)?.join(callRoomID);
          
          // Send ICE servers to both participants
          const iceServers = {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun.relay.metered.ca:80' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          };
          
          socket.emit("ice-servers", iceServers);
          io.to(callerId).emit("ice-servers", iceServers);
          
          // Notify caller that call was accepted
          io.to(callerId).emit("call-accepted", { 
            roomID: callRoomID,
            acceptedBy: myPhone || socket.id,
            timestamp: new Date(),
            otherUser: {
              id: socket.id,
              displayName: answererUser?.displayName || 'Unknown',
              phone: myPhone
            }
          });
          
          // Notify answerer
          socket.emit("call-started", {
            roomID: callRoomID,
            withUser: socketToUser[callerId]?.displayName || 'Unknown',
            timestamp: new Date(),
            otherUser: {
              id: callerId,
              displayName: callerUser?.displayName || 'Unknown',
              phone: callerPhone
            }
          });
          
          // Log call history for both participants
          try {
            const callStartTime = new Date();
            const callerUser = socketToUser[callerId];
            const answererUser = socketToUser[socket.id];
            
            // Create call history for caller (outgoing)
            if (callerUser && callerPhone) {
              await CallHistory.createCallRecord({
                userId: callerUser.uid || callerId,
                userPhone: callerPhone,
                userName: callerUser.displayName || 'Unknown',
                otherParticipantPhone: myPhone || 'Unknown',
                otherParticipantName: answererUser?.displayName || 'Unknown',
                otherParticipantId: socket.id,
                callType: 'outgoing',
                status: 'completed',
                startTime: callStartTime,
                roomId: callRoomID,
                sessionId: callRoomID
              });
            }
            
            // Create call history for answerer (incoming)
            if (answererUser && myPhone) {
              await CallHistory.createCallRecord({
                userId: answererUser.uid || socket.id,
                userPhone: myPhone,
                userName: answererUser.displayName || 'Unknown',
                otherParticipantPhone: callerPhone || 'Unknown',
                otherParticipantName: callerUser?.displayName || 'Unknown',
                otherParticipantId: callerId,
                callType: 'incoming',
                status: 'completed',
                startTime: callStartTime,
                roomId: callRoomID,
                sessionId: callRoomID
              });
            }
          } catch (dbError) {
            logger.error('Failed to create call history', dbError);
          }
          
          logger.logRoomEvent(callRoomID, 'call_accepted', { answerer: socket.id, caller: callerId });
        } else {
          // Reject the call
          io.to(callerId).emit("call-rejected", { 
            rejectedBy: myPhone || socket.id,
            timestamp: new Date() 
          });
          
          // Set caller back to available
          const callerPhone = socketToPhone[callerId];
          if (callerPhone && phoneToRoom[callerPhone]) {
            const callerRoom = rooms[phoneToRoom[callerPhone]];
            if (callerRoom) {
              callerRoom.isAvailable = true;
            }
          }
          
          // Log rejected call for both participants
          try {
            const callTime = new Date();
            const callerUser = socketToUser[callerId];
            const rejecterUser = socketToUser[socket.id];
            
            // Create missed call for caller
            if (callerUser && callerPhone) {
              await CallHistory.createCallRecord({
                userId: callerUser.uid || callerId,
                userPhone: callerPhone,
                userName: callerUser.displayName || 'Unknown',
                otherParticipantPhone: myPhone || 'Unknown',
                otherParticipantName: rejecterUser?.displayName || 'Unknown',
                otherParticipantId: socket.id,
                callType: 'outgoing',
                status: 'rejected',
                startTime: callTime,
                duration: 0
              });
            }
            
            // Create missed call for rejecter
            if (rejecterUser && myPhone) {
              await CallHistory.createCallRecord({
                userId: rejecterUser.uid || socket.id,
                userPhone: myPhone,
                userName: rejecterUser.displayName || 'Unknown',
                otherParticipantPhone: callerPhone || 'Unknown',
                otherParticipantName: callerUser?.displayName || 'Unknown',
                otherParticipantId: callerId,
                callType: 'incoming',
                status: 'missed',
                startTime: callTime,
                duration: 0
              });
            }
          } catch (dbError) {
            logger.error('Failed to create rejected call history', dbError);
          }
          
          delete socketToUser[callerId];
          logger.logRoomEvent(myRoomID, 'call_rejected', { rejector: socket.id, caller: callerId });
        }
      } catch (error) {
        logger.error('Answer call error', error, { socketId: socket.id, callerId });
      }
    });

    // Simplified room joining
    socket.on("join-room", async ({ roomID, user }) => {
      try {
        const room = rooms[roomID];
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check room capacity
        if (Object.keys(room.users).length >= 10) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        room.users[socket.id] = user;
        socketToUser[socket.id] = user;
        socket.join(roomID);

        const otherUsers = { ...room.users };
        delete otherUsers[socket.id];

        socket.emit("all-users", otherUsers);
        
        // Send enhanced ICE servers for better connectivity
        socket.emit("ice-servers", {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // Add more public STUN servers for better connectivity
            { urls: 'stun:stun.relay.metered.ca:80' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        });

        // Update database
        try {
          await Room.findOneAndUpdate(
            { roomID },
            { 
              $push: { users: { socketId: socket.id, ...user, joinedAt: new Date() } },
              $set: { lastActivity: new Date() }
            }
          );
        } catch (dbError) {
          logger.error('Database update error', dbError);
          // Continue without database update
        }
        
        logger.logVideoCallStart(roomID, socket.id, socket.handshake.address || 'unknown');
      } catch (error) {
        logger.error('Join room error', error, { socketId: socket.id, roomID });
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // WebRTC signaling
    socket.on("sending-signal", ({ userToSignal, callerID, signal }) => {
      try {
        io.to(userToSignal).emit("user-joined", {
          signal,
          callerID,
          user: socketToUser[callerID],
          timestamp: new Date()
        });
        
        logger.logWebRTCSignal(callerID, userToSignal, 'offer');
      } catch (error) {
        logger.error('Sending signal error', error, { socketId: socket.id });
      }
    });

    socket.on("returning-signal", ({ callerID, signal }) => {
      try {
        io.to(callerID).emit("receiving-returned-signal", {
          signal,
          id: socket.id,
          timestamp: new Date()
        });
        
        logger.logWebRTCSignal(socket.id, callerID, 'answer');
      } catch (error) {
        logger.error('Returning signal error', error, { socketId: socket.id });
      }
    });

    socket.on("sending-ice-candidate", ({ to, candidate }) => {
      try {
        io.to(to).emit("receiving-ice-candidate", {
          from: socket.id,
          candidate,
          timestamp: new Date()
        });
        
        logger.logWebRTCSignal(socket.id, to, 'ice-candidate');
      } catch (error) {
        logger.error('ICE candidate error', error, { socketId: socket.id });
      }
    });

    // Simplified media controls
    socket.on("toggle-mic", ({ roomID, micOn }) => {
      try {
        socket.to(roomID).emit("user-toggled-mic", {
          userID: socket.id,
          micOn,
          timestamp: new Date()
        });
        
        logger.logRoomEvent(roomID, 'mic_toggled', { user: socket.id, micOn });
      } catch (error) {
        logger.error('Toggle mic error', error, { socketId: socket.id, roomID });
      }
    });

    socket.on("toggle-video", ({ roomID, videoOn }) => {
      try {
        socket.to(roomID).emit("user-toggled-video", {
          userID: socket.id,
          videoOn,
          timestamp: new Date()
        });
        
        logger.logRoomEvent(roomID, 'video_toggled', { user: socket.id, videoOn });
      } catch (error) {
        logger.error('Toggle video error', error, { socketId: socket.id, roomID });
      }
    });

    // Simplified chat messaging
    socket.on("chat-message", ({ roomID, message }) => {
      try {
        const user = socketToUser[socket.id];
        
        if (!user || !message || !roomID) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        
        const chatData = {
          id: generateUniqueId(),
          message: message.substring(0, 500), // Basic message length limit
          sender: {
            id: socket.id,
            displayName: user.displayName || 'Anonymous'
          },
          timestamp: new Date(),
          roomID
        };
        
        io.to(roomID).emit("chat-message", chatData);
        
        logger.logRoomEvent(roomID, 'chat_message', { sender: socket.id });
      } catch (error) {
        logger.error('Chat message error', error, { socketId: socket.id, roomID });
      }
    });

    // Simplified connection quality monitoring
    socket.on("connection-quality", ({ roomID, quality, stats }) => {
      try {
        if (quality === 'poor') {
          logger.logConnectionIssue(roomID, socket.id, 'Poor connection quality reported');
          
          // Notify other users in the room about connection issues
          socket.to(roomID).emit("user-connection-poor", {
            userId: socket.id,
            timestamp: new Date()
          });
        }
        
        logger.logRoomEvent(roomID, 'connection_quality', { user: socket.id, quality });
      } catch (error) {
        logger.error('Connection quality error', error, { socketId: socket.id, roomID });
      }
    });

    // New: Screen sharing events
    socket.on("start-screen-share", ({ roomID }) => {
      try {
        socket.to(roomID).emit("screen-share-started", {
          userId: socket.id,
          timestamp: new Date()
        });
        
        logger.logRoomEvent(roomID, 'screen_share_started', { user: socket.id });
      } catch (error) {
        logger.error('Start screen share error', error, { socketId: socket.id, roomID });
      }
    });

    socket.on("stop-screen-share", ({ roomID }) => {
      try {
        socket.to(roomID).emit("screen-share-stopped", {
          userId: socket.id,
          timestamp: new Date()
        });
        
        logger.logRoomEvent(roomID, 'screen_share_stopped', { user: socket.id });
      } catch (error) {
        logger.error('Stop screen share error', error, { socketId: socket.id, roomID });
      }
    });

    // Enhanced disconnect handling
    const handleDisconnect = async (reason = 'unknown') => {
      try {
        const user = socketToUser[socket.id];
        const disconnectTime = new Date();
        
        if (!user) {
          logger.info(`User disconnected without user data: ${socket.id}`);
          return;
        }

        let roomID;
        for (const id in rooms) {
          if (rooms[id].users[socket.id]) {
            roomID = id;
            break;
          }
        }

        if (roomID) {
          const room = rooms[roomID];
          
          // Calculate session duration
          const sessionDuration = disconnectTime - (room.users[socket.id]?.joinedAt || disconnectTime);
          
          delete room.users[socket.id];

          if (socket.id === room.host) {
            // Host left - end the room
            Object.keys(room.users).forEach((uid) =>
              io.to(uid).emit("host-left", {
                timestamp: disconnectTime,
                reason: 'Host disconnected'
              })
            );
            
            delete rooms[roomID];
            
            // Clean up database
            try {
              await Room.deleteOne({ roomID });
            } catch (dbError) {
              logger.error('Database cleanup error', dbError);
            }
            
            logger.logRoomEvent(roomID, 'ended_by_host', { host: socket.id, reason });
          } else {
            // Regular participant left
            io.to(roomID).emit("user-disconnected", {
              userId: socket.id,
              timestamp: disconnectTime,
              reason
            });
            
            // Update database
            try {
              await Room.findOneAndUpdate(
                { roomID },
                { 
                  $pull: { users: { socketId: socket.id } },
                  $set: { lastActivity: disconnectTime }
                }
              );
            } catch (dbError) {
              logger.error('Database update error', dbError);
            }
          }
          
          logger.logVideoCallEnd(roomID, socket.id, sessionDuration);
        }

        // Clean up all mappings
        const userPhone = socketToPhone[socket.id];
        if (userPhone) {
          delete phoneToRoom[userPhone];
          delete socketToPhone[socket.id];
        }
        delete socketToUser[socket.id];
        
        logger.info(`❌ User disconnected: ${socket.id}, phone: ${userPhone || 'none'}, reason: ${reason}`);
      } catch (error) {
        logger.error('Disconnect handling error', error, { socketId: socket.id });
      }
    };

    socket.on("leave-room", () => handleDisconnect('user_left'));
    socket.on("disconnect", (reason) => handleDisconnect(reason));
    
    // Error handling
    socket.on("error", (error) => {
      logger.error(`Socket error from ${socket.id}`, error);
    });
  });
};
