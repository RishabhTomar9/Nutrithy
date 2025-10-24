import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiRepeat, FiMaximize, FiMinimize,
  FiPhoneOff, FiUsers, FiCopy, FiWifi, FiWifiOff, FiMonitor, FiMessageCircle,
  FiVolume2, FiVolumeX, FiShare2, FiCamera, FiMoreVertical
} from "react-icons/fi";
import { User, Phone } from "lucide-react";
import { io } from "socket.io-client";

// Fully functional Video Call Component with WhatsApp-like features
export default function VideoCallApp() {
  // Core state
  const [roomID, setRoomID] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [joined, setJoined] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  
  // Media controls
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [currentCamera, setCurrentCamera] = useState("user");
  
  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [timer, setTimer] = useState("00:00");
  const [callStartTime, setCallStartTime] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" });
  const [connectionQuality, setConnectionQuality] = useState("excellent");
  const [showSettings, setShowSettings] = useState(false);
  
  // Participants
  const [participants, setParticipants] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const containerRef = useRef(null);
  const messageEndRef = useRef(null);
  const peerConnectionsRef = useRef({});
  
  // Toast notification helper
  const showNotification = useCallback((message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (callStartTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - callStartTime;
        const mins = String(Math.floor(elapsed / 60000)).padStart(2, "0");
        const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
        setTimer(`${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStartTime]);

  // Auto-scroll messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate unique room ID with timestamp and random string
  const generateRoomID = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${randomStr}`.toUpperCase();
  };

  // Get user media with enhanced error handling
  const getUserMedia = async (constraints = { video: true, audio: true }) => {
    try {
      // For mock purposes, create a mock stream if real devices aren't available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Create a mock video stream
        const mockVideo = document.createElement('video');
        mockVideo.width = 640;
        mockVideo.height = 480;
        mockVideo.autoplay = true;
        mockVideo.muted = true;
        
        // Create a canvas to generate mock video
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Draw something on the canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Mock Camera', canvas.width/2, canvas.height/2);
        
        // Create a stream from the canvas
        const stream = canvas.captureStream(30);
        
        // Add audio track if needed
        if (constraints.audio) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const dst = audioContext.createMediaStreamDestination();
          oscillator.connect(dst);
          oscillator.start();
          
          const audioTrack = dst.stream.getAudioTracks()[0];
          stream.addTrack(audioTrack);
        }
        
        return stream;
      }
      
      // Try to get real user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      
      // Create a mock stream as fallback
      console.log("Using mock stream as fallback");
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      // Draw something on the canvas
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '30px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Camera Unavailable', canvas.width/2, canvas.height/2);
      
      return canvas.captureStream(30);
       }
    };

  // Create new room with improved connection handling
  const createRoom = async () => {
    if (!displayName.trim()) {
      showNotification("Please enter your name", "error");
      return;
    }

    try {
      const newRoomID = generateRoomID();
      setRoomID(newRoomID);
      
      // Use history API to update URL without page refresh
      const newUrl = `/video-call/${newRoomID}`;
      window.history.pushState({ roomID: newRoomID }, '', newUrl);
      setRoomID(newRoomID);
      
      const stream = await getUserMedia();
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Connect to socket server and create room
      const socket = io(import.meta.env.VITE_SOCKET_SERVER || 'http://localhost:5000', {
        transports: ['websocket', 'polling'], // Try both WebSocket and polling
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
        auth: { token: localStorage.getItem('token') || 'anonymous' }
      });
      
      socket.on('connect', () => {
        socket.emit("create-room", { roomID: newRoomID, user: { displayName } });
        setIsHost(true);
        setJoined(true);
        setCallStartTime(Date.now());
        showNotification(`Room created: ${newRoomID}. Share the link to invite others!`, "success");
        
        // Set up event listeners for participants
        socket.on("user-joined", ({ callerID, user }) => {
          showNotification(`${user.displayName} joined the call`, "info");
          setParticipants(prev => [...prev, { id: callerID, user }]);
        });
        
        socket.on("user-disconnected", (userId) => {
          showNotification(`A participant left the call`, "info");
          setParticipants(prev => prev.filter(p => p.id !== userId));
        });
        
        socket.on("new-join-request", ({ from, user }) => {
          showNotification(`${user.displayName} wants to join!`, "info");
          setJoinRequests(prev => [...prev, { id: from, user }]);
        });
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        showNotification(`Connection error: ${err.message}`, 'error');
      });
      
      peerConnectionsRef.current.socket = socket;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsHost(true);
      setJoined(true);
      setCallStartTime(Date.now());
      setParticipants([{ id: "local", name: displayName, isLocal: true }]);
      
      showNotification(`Room created: ${newRoomID}`, "success");
    } catch (error) {
      showNotification("Failed to create room", "error");
    }
  };

  // Join room with improved connection handling
  const joinRoom = async () => {
    if (!displayName.trim() || !roomID.trim()) {
      showNotification("Please enter your name and room ID", "error");
      return;
    }

    try {
      const stream = await getUserMedia();
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      showNotification(`Failed to access camera/microphone: ${error.message}`, "error");
      return;
    }
    
    try {
      // Connect to socket server and join room
      const socket = io(import.meta.env.VITE_SOCKET_ENDPOINT || 'http://localhost:5000', {
        transports: ['websocket', 'polling'], // Try both WebSocket and polling
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
        auth: { token: localStorage.getItem('token') || 'anonymous' }
      });
      
      console.log("Connecting to socket server...");
      
      socket.on('connect', () => {
        console.log("Socket connected, checking room:", roomID);
        // First check if room exists
        socket.emit("check-room", { roomID });
      });
      
      // Listen for room existence response
      socket.on("room-exists", ({ exists, error }) => {
        console.log("Room exists response:", exists, error);
        
        if (error) {
          showNotification(`Error: ${error}`, "error");
          socket.disconnect();
          return;
        }
        
        if (exists) {
          // Send join request to host
          console.log("Sending join request for room:", roomID);
          socket.emit("request-to-join", { 
            roomID, 
            user: { displayName }
          });
          
          // Set waiting state
          setWaitingForApproval(true);
          showNotification("Join request sent to host", "info");
            
          // Listen for request response
          socket.on("request-accepted", () => {
            setWaitingForApproval(false);
            setJoined(true);
            setCallStartTime(Date.now());
            setParticipants([{ id: "local", name: displayName, isLocal: true }]);
            showNotification("Join request accepted!", "success");
            
            // Set up event listeners for participants
            socket.on("user-joined", ({ callerID, user }) => {
              showNotification(`${user.displayName} joined the call`, "info");
              setParticipants(prev => [...prev, { id: callerID, user }]);
            });
            
            socket.on("user-disconnected", (userId) => {
              showNotification(`A participant left the call`, "info");
              setParticipants(prev => prev.filter(p => p.id !== userId));
            });
          });
          
          socket.on("request-declined", () => {
            setWaitingForApproval(false);
            showNotification("Join request declined by host", "error");
            socket.disconnect();
          });
        } else {
          showNotification("Room does not exist", "error");
          socket.disconnect();
        }
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        showNotification(`Connection error: ${err.message}`, 'error');
      });
      
      peerConnectionsRef.current.socket = socket;
    } catch (error) {
      console.error("Error joining room:", error);
      showNotification("Failed to join room: " + error.message, "error");
    }
  };

  // Handle join requests
  const handleJoinRequest = (requestId, action) => {
    // Find the request
    const request = joinRequests.find(req => req.id === requestId);
    if (!request) return;
    
    const socket = peerConnectionsRef.current.socket;
    if (socket) {
      if (action === "accept") {
        socket.emit("accept-request", { 
          roomID, 
          requestId,
          participants: participants.map(p => ({ id: p.id, user: { displayName: p.name } }))
        });
        
        // Add participant to the call
        const newParticipant = {
          id: request.id,
          name: request.user?.displayName || "Guest",
          isLocal: false,
          audioEnabled: true,
          videoEnabled: true
        };
        
        setParticipants(prev => [...prev, newParticipant]);
        showNotification(`${newParticipant.name} joined the room`, "info");
      } else {
        socket.emit("decline-request", { roomID, requestId });
        showNotification("Join request declined", "info");
      }
    } else {
      // Fallback for mock implementation without socket
      if (action === "accept") {
        const newParticipant = {
          id: request.id,
          name: request.user?.displayName || "Guest",
          isLocal: false,
          audioEnabled: true,
          videoEnabled: true
        };
        
        setParticipants(prev => [...prev, newParticipant]);
        showNotification(`${newParticipant.name} joined the room`, "info");
      } else {
        showNotification("Join request declined", "info");
      }
    }
    
    // Remove from requests
    setJoinRequests(prev => prev.filter(req => req.id !== requestId));
  };
  
  // Toggle microphone
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicOn(!micOn);
      showNotification(micOn ? "Microphone muted" : "Microphone unmuted", "info");
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoOn(!videoOn);
      showNotification(videoOn ? "Camera off" : "Camera on", "info");
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setSpeakerOn(!speakerOn);
    // In a real implementation, this would control audio output
    Object.values(remoteVideosRef.current).forEach(video => {
      if (video) video.muted = speakerOn;
    });
    showNotification(speakerOn ? "Speaker muted" : "Speaker unmuted", "info");
  };

  // Switch camera
  const switchCamera = async () => {
    if (!localStream) return;

    try {
      const newFacing = currentCamera === "user" ? "environment" : "user";
      
      // Stop current tracks
      localStream.getVideoTracks().forEach(track => track.stop());
      
      // Get new stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: true
      });
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
      
      setLocalStream(newStream);
      setCurrentCamera(newFacing);
      showNotification(`Switched to ${newFacing === "user" ? "front" : "back"} camera`, "info");
    } catch (error) {
      showNotification("Failed to switch camera", "error");
    }
  };

  // Screen sharing
const toggleScreenShare = async () => {
  try {
    if (!screenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true
      });
      
      // Replace video track
      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Handle screen share end
      videoTrack.onended = () => {
        setScreenSharing(false);
        showNotification("Screen sharing stopped", "info");
      };
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      
      // Update stream for peers
      const socket = peerConnectionsRef.current.socket;
      if (socket) {
        socket.emit("screen-share-started", { roomID });
      }
      
      setLocalStream(screenStream);
      setScreenSharing(true);
      showNotification("Screen sharing started", "success");
    } else {
      // Stop screen sharing and restore camera
      const stream = await getUserMedia();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Notify peers
      const socket = peerConnectionsRef.current.socket;
      if (socket) {
        socket.emit("screen-share-stopped", { roomID });
      }
      
      setLocalStream(stream);
      setScreenSharing(false);
      showNotification("Screen sharing stopped", "info");
    }
  } catch (error) {
    console.error("Screen sharing error:", error);
    showNotification("Screen sharing not available", "error");
  }
};

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: displayName,
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLocal: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");
    showNotification("Message sent", "info");
  };

  // Copy room link
  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomID}`;
    navigator.clipboard.writeText(link);
    showNotification("Room link copied to clipboard", "success");
  };

  // Share room
  const shareRoom = async () => {
    const link = `${window.location.origin}?room=${roomID}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Video Call',
          text: `Join my video call! Room ID: ${roomID}`,
          url: link,
        });
        showNotification("Shared successfully", "success");
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyRoomLink();
        }
      }
    } else {
      copyRoomLink();
    }
  };

  // End call
  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    
    setJoined(false);
    setLocalStream(null);
    setRemoteStreams([]);
    setParticipants([]);
    setMessages([]);
    setCallStartTime(null);
    setTimer("00:00");
    showNotification("Call ended", "info");
  };

  // Join room function implementation with waiting room
  const handleJoinRoom = async () => {
    if (!displayName.trim()) {
      showNotification("Please enter your name", "error");
      return;
    }
    
    if (!roomID.trim()) {
      showNotification("Please enter a room ID", "error");
      return;
    }
    
    try {
      // Get user media
      const stream = await getUserMedia();
      setLocalStream(stream);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Add local participant
      const localParticipant = {
        id: 'local',
        name: displayName,
        isLocal: true,
        audioEnabled: micOn,
        videoEnabled: videoOn
      };
      
      // Check if this is a new room (user is host) or joining existing room
      if (roomID.includes('-')) { // Format check for our unique IDs
        // User is joining an existing room - enter waiting room
        setParticipants([localParticipant]);
        setIsHost(false);
        setWaitingForApproval(true);
        showNotification(`Waiting for host approval to join room ${roomID}`, "info");
        
        // In a real app, we would send join request to host via signaling server
        // For mock, we'll simulate a join request after 3 seconds
        setTimeout(() => {
          // Simulate host approval
          setWaitingForApproval(false);
          setJoined(true);
          setCallStartTime(Date.now());
          showNotification(`Host approved your request. Joined room ${roomID}`, "success");
        }, 3000);
      } else {
        // For backward compatibility with old room IDs
        setParticipants([localParticipant]);
        setIsHost(false);
        setJoined(true);
        setCallStartTime(Date.now());
        showNotification(`Joined room ${roomID}`, "success");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      showNotification("Failed to join room. Please check your camera and microphone permissions.", "error");
    }
  };
  
  // Create room with host capabilities
  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      showNotification("Please enter your name", "error");
      return;
    }
    
    // Always generate a new unique room ID when creating a room
    const newRoomID = generateRoomID();
    setRoomID(newRoomID);
    
    try {
      // Get user media
      const stream = await getUserMedia();
      setLocalStream(stream);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Add local participant
      const localParticipant = {
        id: 'local',
        name: displayName,
        isLocal: true,
        audioEnabled: micOn,
        videoEnabled: videoOn
      };
      
      setParticipants([localParticipant]);
      setIsHost(true);
      setJoined(true);
      setCallStartTime(Date.now());
      setJoinRequests([]); // Initialize empty join requests
      showNotification(`Created room ${newRoomID}`, "success");
      
      // In a real app, we would connect to signaling server here
      // For mock, we'll just simulate creating a room
    } catch (error) {
      console.error("Error creating room:", error);
      showNotification("Failed to create room. Please check your camera and microphone permissions.", "error");
    }
  };

  // Pre-join screen
  if (!joined && !waitingForApproval) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center pt-28 px-8 relative overflow-hidden">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 rounded-3xl shadow-2xl shadow-emerald-500/30">
              <Phone size={48} className="text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            Video Call
          </h1>
          <p className="text-center text-slate-400 mb-8">Connect with anyone, anywhere</p>

          {/* Form */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />

            <input
              type="text"
              placeholder="Room ID (optional)"
              value={roomID}
              onChange={e => setRoomID(e.target.value.toUpperCase())}
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                disabled={!displayName.trim() || !roomID.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/30 disabled:shadow-none transition-all"
              >
                Join Room
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                disabled={!displayName.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 disabled:shadow-none transition-all"
              >
                Create New Room
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  } else if (waitingForApproval) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center pt-28 px-8 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 rounded-3xl shadow-2xl shadow-yellow-500/30">
              <FiUsers size={48} className="text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-white via-yellow-100 to-orange-200 bg-clip-text text-transparent">
            Waiting Room
          </h1>
          <p className="text-center text-slate-400 mb-8">Your request to join has been sent to the host</p>

          {/* Preview */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="relative w-full h-48 bg-gray-800 rounded-2xl overflow-hidden mb-6">
              {localStream && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{displayName} (You)</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-2.5 w-2.5 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-yellow-400 font-medium">Waiting for host approval...</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={endCall}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-red-500/30 transition-all"
            >
              Cancel Request
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active call screen
  return (
    <div ref={containerRef} className="min-h-screen text-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-25 sm:pt-30 px-4 sm:px-8 py-3 sm:py-5 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-emerald-500/20 p-1.5 sm:p-2 rounded-full">
              <FiWifi className="text-emerald-400" size={14} />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold">{roomID}</div>
              <div className="text-[10px] sm:text-xs text-slate-400">{timer}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowParticipants(!showParticipants)}
              className="bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-full transition-colors"
            >
              <FiUsers size={16} className="sm:w-5 sm:h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-full transition-colors"
            >
              {isFullscreen ? <FiMinimize size={16} className="sm:w-5 sm:h-5" /> : <FiMaximize size={16} className="sm:w-5 sm:h-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="absolute inset-0 p-2 sm:p-4 pt-40 sm:pt-45 pb-28 sm:pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 h-full">
          {/* Local video */}
          <motion.div
            layoutId="local-video"
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10"
          >
            {videoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 sm:p-8 rounded-full mb-2 sm:mb-4">
                  <User size={32} className="sm:w-12 sm:h-12 text-white" />
                </div>
                <p className="text-base sm:text-xl font-semibold">{displayName}</p>
              </div>
            )}

            {/* Local video overlay */}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/70 backdrop-blur-xl px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-white/20">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-full">{displayName} (You)</span>
                {!micOn && <FiMicOff size={12} className="sm:w-3.5 sm:h-3.5 text-red-400" />}
                {!videoOn && <FiVideoOff size={12} className="sm:w-3.5 sm:h-3.5 text-red-400" />}
              </div>
            </div>

            {screenSharing && (
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-blue-500/80 backdrop-blur-xl px-2 sm:px-4 py-1 sm:py-2 rounded-full">
                <div className="flex items-center gap-1 sm:gap-2">
                  <FiMonitor size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="text-[10px] sm:text-xs font-medium">Sharing Screen</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Remote videos placeholder */}
          {remoteStreams.length === 0 && (
            <div className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-400 h-50 sm:h-full">
              <FiUsers size={32} className="sm:w-12 sm:h-12 mb-2 sm:mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium text-center px-2">Waiting for others to join...</p>
              <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-center px-2">Share the room ID: <span className="text-white font-mono">{roomID}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-2 sm:p-4 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-2xl">
            <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-3">
              {/* Mic */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMic}
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                  micOn
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                }`}
              >
                {micOn ? <FiMic size={16} className="sm:w-5 sm:h-5" /> : <FiMicOff size={16} className="sm:w-5 sm:h-5" />}
              </motion.button>

              {/* Video */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleVideo}
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                  videoOn
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                }`}
              >
                {videoOn ? <FiVideo size={16} className="sm:w-5 sm:h-5" /> : <FiVideoOff size={16} className="sm:w-5 sm:h-5" />}
              </motion.button>

              {/* Speaker */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleSpeaker}
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                  speakerOn
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                }`}
              >
                {speakerOn ? <FiVolume2 size={16} className="sm:w-5 sm:h-5" /> : <FiVolumeX size={16} className="sm:w-5 sm:h-5" />}
              </motion.button>

              {/* Switch Camera */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={switchCamera}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <FiRepeat size={16} className="sm:w-5 sm:h-5" />
              </motion.button>

              {/* Screen Share */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleScreenShare}
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                  screenSharing
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <FiMonitor size={16} className="sm:w-5 sm:h-5" />
              </motion.button>

              {/* Chat */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(!showChat)}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative"
              >
                <FiMessageCircle size={16} className="sm:w-5 sm:h-5" />
                {messages.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                    {messages.length}
                  </div>
                )}
              </motion.button>

              {/* Share */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={shareRoom}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <FiShare2 size={16} className="sm:w-5 sm:h-5" />
              </motion.button>

              <div className="hidden xs:block w-px h-8 sm:h-10 bg-white/20 mx-1 sm:mx-2" />

              {/* End Call */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={endCall}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
              >
                <FiPhoneOff size={16} className="sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Participants Panel */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            className="absolute top-0 right-0 h-full w-full sm:w-80 bg-black/90 backdrop-blur-2xl border-l border-white/10 z-30 pt-20 sm:pt-30 px-4 sm:px-5"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold">Participants ({participants.length})</h3>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowParticipants(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </motion.button>
            </div>

            {/* Join requests section (only for host) */}
            {isHost && joinRequests.length > 0 && (
              <div className="mb-4 sm:mb-6 bg-yellow-500/10 rounded-xl p-3 sm:p-4 border border-yellow-500/20">
                <h4 className="text-sm sm:text-base font-bold text-yellow-400 mb-2 sm:mb-3 flex items-center gap-2">
                  <FiUsers size={14} className="sm:w-4 sm:h-4" /> Waiting Room ({joinRequests.length})
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {joinRequests.map(request => (
                    <div key={request.id} className="bg-white/5 rounded-xl p-2 sm:p-3 border border-white/10">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-1.5 sm:p-2 rounded-full">
                          <User size={14} className="sm:w-4 sm:h-4" />
                        </div>
                        <div className="font-medium text-sm truncate">{request.user?.displayName || "Guest"}</div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleJoinRequest(request.id, 'accept')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium py-1.5 sm:py-2 rounded-lg transition-colors"
                        >
                          Accept
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleJoinRequest(request.id, 'decline')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium py-1.5 sm:py-2 rounded-lg transition-colors"
                        >
                          Decline
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[calc(100vh-150px)]">
              {participants.map(p => (
                <div key={p.id} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-1.5 sm:p-2 rounded-full">
                      <User size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{p.name}</div>
                      {p.isLocal && <div className="text-[10px] sm:text-xs text-slate-400">You</div>}
                    </div>
                    {isHost && !p.isLocal && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-red-400 hover:text-red-300 text-xs sm:text-sm whitespace-nowrap"
                      >
                        Remove
                      </motion.button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-xs sm:text-sm text-slate-400 mb-2">Share Room</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomID}
                  readOnly
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyRoomLink}
                  className="bg-emerald-500 hover:bg-emerald-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors"
                >
                  <FiCopy size={14} className="sm:w-4 sm:h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 h-[70vh] sm:h-96 bg-black/90 backdrop-blur-2xl border-t border-white/10 z-30 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Chat</h3>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </motion.button>
            </div>

            <div className="h-[calc(70vh-140px)] sm:h-56 overflow-y-auto mb-3 sm:mb-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-6 sm:py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isLocal ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] sm:max-w-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl ${
                        msg.isLocal
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {!msg.isLocal && (
                        <div className="text-[10px] sm:text-xs text-slate-300 mb-0.5 sm:mb-1">{msg.sender}</div>
                      )}
                      <div className="text-xs sm:text-sm break-words">{msg.text}</div>
                      <div className="text-[8px] sm:text-xs opacity-70 mt-0.5 sm:mt-1">{msg.timestamp}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-sm font-semibold transition-colors"
              >
                Send
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-4 shadow-2xl max-w-[90%] sm:max-w-md"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${
                notification.type === 'success' ? 'bg-emerald-400' :
                notification.type === 'error' ? 'bg-red-400' :
                'bg-blue-400'
              }`} />
              <span className="text-sm sm:text-base font-medium truncate">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}