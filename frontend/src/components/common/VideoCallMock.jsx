import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import SimplePeer from "simple-peer";
import io from "socket.io-client";
import { useAuth } from "../../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiRepeat, FiMaximize, FiExternalLink,
  FiPhoneOff, FiUsers, FiCopy, FiRefreshCw, FiWifi, FiWifiOff, FiSettings, 
  FiMessageCircle, FiMonitor, FiVolumeX, FiVolume2, FiShare2
} from "react-icons/fi";
import { User, Phone, PhoneCall } from "lucide-react";
import styled from "styled-components";
import toast from 'react-hot-toast';

const SOCKET_SERVER = import.meta.env.VITE_SOCKET_SERVER || "http://localhost:5000";

// Styled Components
const VideoContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  overflow-y: auto;
  position: relative;

  /* Enhanced scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 1rem;
  }
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 1400px;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const VideoWrapper = styled(motion.div)`
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.1);
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
  aspect-ratio: 16/9;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 25px 30px -5px rgba(0, 0, 0, 0.4),
      0 15px 15px -5px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    border-radius: 0.75rem;
  }
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ControlsBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(30, 41, 59, 0.95);
  border-radius: 2rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
    padding: 0.5rem;
  }
`;

const ControlButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 1.3rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  background: ${props => {
    if (props.variant === 'danger') return 'linear-gradient(135deg, #ef4444, #dc2626)';
    if (props.variant === 'success') return 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (props.active) return props.activeColor || 'linear-gradient(135deg, #3b82f6, #2563eb)';
    return props.color || 'linear-gradient(135deg, #475569, #334155)';
  }};
  
  box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.2);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    filter: grayscale(20%);
    
    /* Subtle pulse animation for disabled state */
    animation: ${props => props.loading ? 'pulse 2s infinite' : 'none'};
  }

  &:focus {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 2px;
  }

  /* Ripple effect for active state */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: width 0.6s, height 0.6s, top 0.6s, left 0.6s;
    transform: translate(-50%, -50%);
  }
  
  &:active::before {
    width: 100%;
    height: 100%;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.8; }
  }

  @media (max-width: 768px) {
    width: 3rem;
    height: 3rem;
    font-size: 1.1rem;
  }
`;

const InfoPanel = styled(motion.div)`
  max-width: 500px;
  margin: 1.5rem auto 0;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
`;

const JoinForm = styled(motion.div)`
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.5);
  color: white;
  margin-bottom: 1rem;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
  
  &::placeholder {
    color: rgba(148, 163, 184, 0.7);
  }
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background: ${props => props.disabled ? '#475569' : '#3b82f6'};
  color: white;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
`;

const Alert = styled(motion.div)`
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 41, 59, 0.9);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  backdrop-filter: blur(8px);
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${props => props.isConnected ? '#4ade80' : '#f87171'};
`;

const ReconnectButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
`;

const Timer = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: white;
  font-variant-numeric: tabular-nums;
`;

const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const WaitingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: rgba(0, 0, 0, 0.41);
  color: white;
  padding: 1rem;
`;

// Styled components for video overlays
const VideoOverlay = styled.div`
  position: absolute;
  ${props => props.position};
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: 0.375rem;
  align-items: center;
`;

const NoVideoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  color: rgba(255, 255, 255, 0.7);
`;

// --- Enhanced Participant Video Component ---
const ParticipantVideo = React.memo(({ peer, micOn = true, videoOn = true, displayName, isLocal = false }) => {
  const videoRef = useRef(null);
  const [hasStream, setHasStream] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!peer) return;

    let mounted = true;
    
    const handleStream = (stream) => {
      if (!mounted) return;
      
      try {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          setHasStream(true);
          setError(null);
        }
      } catch (err) {
        console.error('Error setting video stream:', err);
        setError('Failed to load video');
        toast.error(`Video error for ${displayName || 'participant'}: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    const handleError = (err) => {
      if (!mounted) return;
      console.error('Peer error:', err);
      setError('Connection error');
      setIsLoading(false);
      toast.error(`Connection error with ${displayName || 'participant'}`);
    };

    const handleClose = () => {
      if (!mounted) return;
      setHasStream(false);
      setIsLoading(false);
    };

    peer.on('stream', handleStream);
    peer.on('error', handleError);
    peer.on('close', handleClose);

    return () => {
      mounted = false;
      peer.off('stream', handleStream);
      peer.off('error', handleError);
      peer.off('close', handleClose);
    };
  }, [peer, displayName]);

  const handleVideoError = useCallback((e) => {
    console.error('Video element error:', e);
    setError('Video playback error');
    toast.error(`Video playback error for ${displayName || 'participant'}`);
  }, [displayName]);

  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return (
    <VideoWrapper
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {hasStream && !error ? (
        <VideoElement 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal}
          onError={handleVideoError}
          onLoadedData={handleVideoLoad}
        />
      ) : (
        <NoVideoOverlay>
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "2rem",
                  height: "2rem",
                  border: "3px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "3px solid white",
                  borderRadius: "50%",
                  marginBottom: "0.5rem"
                }}
              />
              <span style={{ fontSize: "0.875rem" }}>Connecting...</span>
            </>
          ) : error ? (
            <>
              <FiWifiOff size={32} style={{ marginBottom: "0.5rem", color: "#ef4444" }} />
              <span style={{ fontSize: "0.875rem", color: "#ef4444" }}>{error}</span>
            </>
          ) : (
            <>
              <User size={48} style={{ marginBottom: "0.5rem" }} />
              <span style={{ fontSize: "0.875rem" }}>No Video</span>
            </>
          )}
        </NoVideoOverlay>
      )}
      
      {/* Name overlay */}
      <VideoOverlay position="bottom: 0.75rem; left: 0.75rem;">
        {displayName || "Guest"}
        {isLocal && " (You)"}
      </VideoOverlay>
      
      {/* Status indicators */}
      <VideoOverlay position="top: 0.75rem; right: 0.75rem;">
        <StatusIndicators>
          {!micOn && <FiMicOff size={14} />}
          {!videoOn && <FiVideoOff size={14} />}
          {error && <FiWifiOff size={14} style={{ color: "#ef4444" }} />}
        </StatusIndicators>
      </VideoOverlay>
    </VideoWrapper>
  );
});

// --- Enhanced Main Video Room Component ---
export default function VideoRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId: urlRoomId } = useParams();
  const [searchParams] = useSearchParams();
  
  // State management
  const [roomID, setRoomID] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [joined, setJoined] = useState(false);
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [currentCamera, setCurrentCamera] = useState("user");
  const [callStartTime, setCallStartTime] = useState(null);
  const [timer, setTimer] = useState("00:00");
  const [socketConnected, setSocketConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });

  // Refs
  const localVideoRef = useRef();
  const videoContainerRef = useRef();
  const peersRef = useRef([]);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mediaDevicesRef = useRef([]);

  // Utility functions
  const showToast = useCallback((message, type = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.error(message, { icon: '⚠️' });
        break;
      default:
        toast(message);
    }
  }, []);

  const formatTimer = useCallback((startTime) => {
    if (!startTime) return "00:00";
    const elapsed = Date.now() - startTime;
    const mins = String(Math.floor(elapsed / 60000)).padStart(2, "0");
    const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");
    return `${mins}:${secs}`;
  }, []);

  const generateRoomID = useCallback(() => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  const validateRoomID = useCallback((id) => {
    return id && id.length >= 6 && /^[a-zA-Z0-9]+$/.test(id);
  }, []);

  // Initialize room ID from URL parameters
  useEffect(() => {
    if (urlRoomId) {
      setRoomID(urlRoomId);
      showToast(`Joining room: ${urlRoomId}`, 'info');
    }
  }, [urlRoomId, showToast]);

  // Update URL when room ID changes
  const updateURL = useCallback((newRoomID) => {
    if (newRoomID && validateRoomID(newRoomID)) {
      navigate(`/video-call/${newRoomID}`, { replace: true });
    }
  }, [navigate, validateRoomID]);

  // Generate shareable room link
  const generateShareableLink = useCallback(() => {
    if (!roomID) return '';
    return `${window.location.origin}/video-call/${roomID}`;
  }, [roomID]);

  // Enhanced room ID setter that updates URL
  const setRoomIDWithURL = useCallback((newRoomID) => {
    setRoomID(newRoomID);
    if (newRoomID && validateRoomID(newRoomID)) {
      updateURL(newRoomID);
    }
  }, [updateURL, validateRoomID]);

  // --- Enhanced Timer ---
  useEffect(() => {
    let interval;
    if (callStartTime) {
      interval = setInterval(() => {
        setTimer(formatTimer(callStartTime));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStartTime, formatTimer]);

  // Network quality monitoring
  useEffect(() => {
    if (!joined || peers.length === 0) return;

    const interval = setInterval(() => {
      // Simple network quality simulation based on peer connections
      const activePeers = peers.filter(p => p.peer && !p.peer.destroyed);
      const quality = activePeers.length > 0 ? 'good' : 'poor';
      setNetworkQuality(quality);
    }, 5000);

    return () => clearInterval(interval);
  }, [joined, peers]);

  // Auto-dismiss alerts after 4 seconds
  useEffect(() => {
    if (alertInfo.open) {
      const timeout = setTimeout(() => {
        setAlertInfo(prev => ({ ...prev, open: false }));
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [alertInfo.open]);

  // Enhanced socket initialization
  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io(SOCKET_SERVER, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      forceNew: true
    });

    socketRef.current = newSocket;
    return newSocket;
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socket = initializeSocket();

    // Socket connection events
    socket.on("connect", () => {
      console.log("Connected with ID:", socket.id);
      setSocketConnected(true);
      setReconnecting(false);
      clearTimeout(reconnectTimeoutRef.current);
      
      // Re-join room if we were in a call and got disconnected
      if (joined && roomID) {
        if (isHost) {
          socket.emit("create-room", { roomID, user });
        } else {
          socket.emit("request-to-join", { roomID, user });
          setWaitingForApproval(true);
        }
      }
    });
    
    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setAlertInfo({ open: true, message: "Connection error. Trying to reconnect...", severity: "error" });
      setSocketConnected(false);
      setReconnecting(true);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setSocketConnected(false);
      if (reason === "io server disconnect") {
        // Disconnected by server, try to reconnect manually
        setReconnecting(true);
        reconnectTimeoutRef.current = setTimeout(() => {
          socket.connect();
        }, 2000);
      }
      // else the socket will automatically try to reconnect
    });
    
    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [roomID, user, joined, isHost]);
  
  // --- Socket.io / PeerJS ---
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;

    sock.on("new-join-request", ({ from, user: requesterUser }) => {
      setAlertInfo({ open: true, message: `${requesterUser.displayName} wants to join!`, severity: "info" });
      setJoinRequests(prev => [...prev, { id: from, user: requesterUser }]);
    });

    sock.on("request-accepted", () => {
      setWaitingForApproval(false);
      setJoined(true);
      setCallStartTime(Date.now());
      sock.emit("join-room", { roomID, user });
    });

    sock.on("request-declined", () => {
      setWaitingForApproval(false);
      setAlertInfo({ open: true, message: "Your request to join was declined.", severity: "error" });
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
    });

    if (joined && stream) {
      sock.emit("get-users", roomID);
      
      sock.on("all-users", users => {
        const newPeers = [];
        for (const userID in users) {
          if (userID === sock.id) continue;
          const peer = createPeer(userID, sock.id, stream);
          peersRef.current.push({ peerID: userID, peer });
          newPeers.push({ peerID: userID, peer, user: users[userID], micOn: true, videoOn: true });
        }
        setPeers(newPeers);
      });

      sock.on("user-joined", ({ signal, callerID, user: joiningUser }) => {
        const peer = addPeer(signal, callerID, stream);
        peersRef.current.push({ peerID: callerID, peer });
        setPeers(prev => [...prev, { peerID: callerID, peer, user: joiningUser, micOn: true, videoOn: true }]);
        setAlertInfo({ open: true, message: `${joiningUser.displayName} has joined the call.`, severity: "info" });
      });

      sock.on("receiving-returned-signal", ({ id, signal }) => {
        const item = peersRef.current.find(p => p.peerID === id);
        if (item) item.peer.signal(signal);
      });

      sock.on("user-disconnected", id => {
        const leavingPeer = peersRef.current.find(p => p.peerID === id);
        if (leavingPeer) leavingPeer.peer.destroy();
        peersRef.current = peersRef.current.filter(p => p.peerID !== id);
        setPeers(prev => prev.filter(p => p.peerID !== id));
        setAlertInfo({ open: true, message: `${leavingPeer?.user?.displayName || "A user"} left the call.`, severity: "warning" });
      });
      
      sock.on("host-left", () => {
        setAlertInfo({ open: true, message: "Host has ended the call", severity: "error" });
        endCall();
      });

      sock.on("user-toggled-mic", ({ userID, micOn }) => setPeers(prev => prev.map(p => p.peerID === userID ? { ...p, micOn } : p)));
      sock.on("user-toggled-video", ({ userID, videoOn }) => setPeers(prev => prev.map(p => p.peerID === userID ? { ...p, videoOn } : p)));
    }

    return () => {
      sock.off("connect");
      sock.off("new-join-request");
      sock.off("request-accepted");
      sock.off("request-declined");
      sock.off("user-joined");
      sock.off("receiving-returned-signal");
      sock.off("user-disconnected");
      sock.off("user-toggled-mic");
      sock.off("user-toggled-video");
      sock.off("all-users");
      sock.off("host-left");
    };
  }, [joined, stream, roomID, user]);

  // --- Peer helpers ---
  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new SimplePeer({ initiator: true, trickle: false, stream });
    peer.on("signal", signal => socketRef.current.emit("sending-signal", { userToSignal, callerID, signal }));
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new SimplePeer({ initiator: false, trickle: false, stream });
    peer.on("signal", signal => socketRef.current.emit("returning-signal", { signal, callerID }));
    peer.signal(incomingSignal);
    return peer;
  };

  // --- Enhanced Media Management ---
  const checkMediaDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      mediaDevicesRef.current = devices;
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      return {
        hasVideo: videoDevices.length > 0,
        hasAudio: audioDevices.length > 0,
        videoDevices,
        audioDevices
      };
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
      return { hasVideo: false, hasAudio: false, videoDevices: [], audioDevices: [] };
    }
  }, []);

  const getMediaStream = useCallback(async (constraints = { video: true, audio: true }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const deviceInfo = await checkMediaDevices();
      
      // Adjust constraints based on available devices
      const adjustedConstraints = {
        video: deviceInfo.hasVideo ? {
          facingMode: currentCamera,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } : false,
        audio: deviceInfo.hasAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(adjustedConstraints);
      return mediaStream;
    } catch (err) {
      console.error("Media access error:", err);
      let errorMessage;
      
      switch (err.name) {
        case "NotAllowedError":
          errorMessage = "Camera/microphone access denied. Please allow access in your browser settings.";
          break;
        case "NotFoundError":
          errorMessage = "No camera or microphone found. Please connect a device and try again.";
          break;
        case "NotReadableError":
          errorMessage = "Camera/microphone is already in use by another application.";
          break;
        case "OverconstrainedError":
          errorMessage = "Camera/microphone constraints cannot be satisfied.";
          break;
        case "AbortError":
          errorMessage = "Media access was aborted.";
          break;
        default:
          errorMessage = `Media access error: ${err.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentCamera, checkMediaDevices, showToast]);

  // Create new room with generated ID
  const createNewRoom = useCallback(async () => {
    const newRoomID = generateRoomID();
    setRoomIDWithURL(newRoomID);
    
    if (!socketConnected) {
      showToast("Not connected to server. Please wait or refresh the page.", 'error');
      return;
    }
    
    if (!user) {
      showToast("Please log in to create a call.", 'error');
      return;
    }
    
    try {
      const mediaStream = await getMediaStream();
      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      const socket = socketRef.current;
      socket.emit("create-room", { roomID: newRoomID, user });
      setIsHost(true);
      setJoined(true);
      setCallStartTime(Date.now());
      showToast(`Created room: ${newRoomID}. Share the link to invite others!`, 'success');
    } catch (err) {
      console.error('Failed to create room:', err);
      showToast('Failed to create room. Please try again.', 'error');
    }
  }, [socketConnected, user, generateRoomID, setRoomIDWithURL, getMediaStream, showToast]);

  // --- Enhanced Call Controls ---
  const startCall = useCallback(async () => {
    if (!validateRoomID(roomID)) {
      showToast("Please enter a valid Room ID (at least 6 characters, alphanumeric only)!", 'error');
      return;
    }
    
    if (!socketConnected) {
      showToast("Not connected to server. Please wait or refresh the page.", 'error');
      return;
    }
    
    if (!user) {
      showToast("Please log in to join a call.", 'error');
      return;
    }
    
    try {
      const mediaStream = await getMediaStream();
      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      const socket = socketRef.current;
      socket.emit("check-room", roomID, roomExists => {
        if (roomExists) {
          socket.emit("request-to-join", { roomID, user });
          setWaitingForApproval(true);
          showToast(`Requesting to join room: ${roomID}`, 'info');
        } else {
          socket.emit("create-room", { roomID, user });
          setIsHost(true);
          setJoined(true);
          setCallStartTime(Date.now());
          setRoomIDWithURL(roomID); // Update URL when creating room
          showToast(`Created room: ${roomID}`, 'success');
        }
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      showToast('Failed to start call. Please try again.', 'error');
    }
  }, [roomID, socketConnected, user, validateRoomID, showToast, getMediaStream, setRoomIDWithURL]);

  const toggleMic = useCallback(() => {
    if (!stream) {
      showToast('No active stream to toggle microphone', 'warning');
      return;
    }
    
    const newMic = !micOn;
    try {
      stream.getAudioTracks().forEach(track => {
        track.enabled = newMic;
      });
      setMicOn(newMic);
      
      if (socketRef.current && joined) {
        socketRef.current.emit("toggle-mic", { roomID, micOn: newMic });
      }
      
      showToast(`Microphone ${newMic ? 'enabled' : 'disabled'}`, 'info');
    } catch (err) {
      console.error('Failed to toggle microphone:', err);
      showToast('Failed to toggle microphone', 'error');
    }
  }, [stream, micOn, roomID, joined, showToast]);

  const toggleVideo = useCallback(() => {
    if (!stream) {
      showToast('No active stream to toggle video', 'warning');
      return;
    }
    
    const newVideo = !videoOn;
    try {
      stream.getVideoTracks().forEach(track => {
        track.enabled = newVideo;
      });
      setVideoOn(newVideo);
      
      if (socketRef.current && joined) {
        socketRef.current.emit("toggle-video", { roomID, videoOn: newVideo });
      }
      
      showToast(`Camera ${newVideo ? 'enabled' : 'disabled'}`, 'info');
    } catch (err) {
      console.error('Failed to toggle video:', err);
      showToast('Failed to toggle camera', 'error');
    }
  }, [stream, videoOn, roomID, joined, showToast]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            mediaSource: 'screen',
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: true
        });
        
        const oldStream = stream;
        setStream(screenStream);
        setScreenSharing(true);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Replace tracks in peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack && oldStream) {
          const oldVideoTrack = oldStream.getVideoTracks()[0];
          peersRef.current.forEach(({ peer }) => {
            if (peer && !peer.destroyed && oldVideoTrack) {
              try {
                peer.replaceTrack(oldVideoTrack, videoTrack, oldStream);
              } catch (err) {
                console.error('Failed to replace track:', err);
              }
            }
          });
        }
        
        // Handle screen share end
        videoTrack.onended = () => {
          setScreenSharing(false);
          showToast('Screen sharing ended', 'info');
          // Restore camera
          getMediaStream().then(newStream => {
            setStream(newStream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = newStream;
            }
          }).catch(err => {
            console.error('Failed to restore camera:', err);
          });
        };
        
        showToast('Screen sharing started', 'success');
      } else {
        // Stop screen sharing
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setScreenSharing(false);
        
        // Restore camera
        const newStream = await getMediaStream();
        setStream(newStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
        
        showToast('Screen sharing stopped', 'info');
      }
    } catch (err) {
      console.error('Screen sharing error:', err);
      setScreenSharing(false);
      
      if (err.name === 'NotAllowedError') {
        showToast('Screen sharing was denied', 'warning');
      } else {
        showToast('Failed to start screen sharing', 'error');
      }
    }
  }, [screenSharing, stream, getMediaStream, showToast]);

  const switchCamera = async () => {
    if (!stream) return;
    const newFacing = currentCamera === "user" ? "environment" : "user";
    const oldStream = stream;
    oldStream.getTracks().forEach(t => t.stop());
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing }, audio: true });
      setStream(newStream);
      setCurrentCamera(newFacing);
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;

      const oldVideoTrack = oldStream.getVideoTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];
      peersRef.current.forEach(({ peer }) => peer.replaceTrack(oldVideoTrack, newVideoTrack, oldStream));
      setAlertInfo({ open: true, message: `Switched to ${newFacing} camera`, severity: "info" });
    } catch (err) {
      console.error(err);
      setAlertInfo({ open: true, message: "Cannot switch camera.", severity: "error" });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) videoContainerRef.current?.requestFullscreen().catch(console.error);
    else document.exitFullscreen();
  };

  const togglePiP = async () => {
    if (localVideoRef.current && document.pictureInPictureEnabled && !localVideoRef.current.disablePictureInPicture) {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await localVideoRef.current.requestPictureInPicture();
      } catch (err) { console.error(err); }
    }
  };

  const endCall = () => {
    setJoined(false);
    setIsHost(false);
    setWaitingForApproval(false);
    setCallStartTime(null);
    setTimer("00:00");
    stream?.getTracks().forEach(track => track.stop());
    peersRef.current.forEach(p => p.peer.destroy());
    peersRef.current = [];
    setPeers([]);
    if (socketRef.current) {
      socketRef.current.emit("leave-room", roomID);
    }
    setAlertInfo({ open: true, message: "You left the call.", severity: "info" });
  };

  const handleCopyRoomID = () => {
    navigator.clipboard.writeText(roomID);
    setAlertInfo({ open: true, message: "Room ID copied!", severity: "success" });
  };

  const handleCopyRoomLink = () => {
    const link = generateShareableLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setAlertInfo({ open: true, message: "Room link copied! Share with others to join.", severity: "success" });
    } else {
      setAlertInfo({ open: true, message: "No room link available", severity: "error" });
    }
  };

  const handleShareRoom = async () => {
    const link = generateShareableLink();
    if (!link) {
      setAlertInfo({ open: true, message: "No room link to share", severity: "error" });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Cook Together video call',
          text: `Join me for cooking! Room ID: ${roomID}`,
          url: link,
        });
        setAlertInfo({ open: true, message: "Room shared successfully!", severity: "success" });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          handleCopyRoomLink(); // Fallback to copying
        }
      }
    } else {
      handleCopyRoomLink(); // Fallback for browsers without native sharing
    }
  };

  // --- Host Actions ---
  const approveJoin = (id) => {
    if (socketRef.current) {
      socketRef.current.emit("respond-to-request", { roomID, to: id, accepted: true });
    }
    setJoinRequests(prev => prev.filter(r => r.id !== id));
    setAlertInfo({ open: true, message: "Request approved", severity: "success" });
  };

  const declineJoin = (id) => {
    if (socketRef.current) {
      socketRef.current.emit("respond-to-request", { roomID, to: id, accepted: false });
    }
    setJoinRequests(prev => prev.filter(r => r.id !== id));
    setAlertInfo({ open: true, message: "Request declined", severity: "error" });
  };

  const removeParticipant = (peerID) => {
    if (socketRef.current) {
      socketRef.current.emit("remove-participant", { roomID, peerID });
    }
    const leavingPeer = peersRef.current.find(p => p.peerID === peerID);
    if (leavingPeer) leavingPeer.peer.destroy();
    peersRef.current = peersRef.current.filter(p => p.peerID !== peerID);
    setPeers(prev => prev.filter(p => p.peerID !== peerID));
    setAlertInfo({ open: true, message: "Participant removed", severity: "warning" });
  };

  // Manual reconnect function
  const handleManualReconnect = () => {
    if (socketRef.current) {
      setReconnecting(true);
      socketRef.current.connect();
      setAlertInfo({ open: true, message: "Attempting to reconnect...", severity: "info" });
    }
  };
  
  // --- Render ---
  if (!joined && !waitingForApproval) {
    return (
      <VideoContainer>
        <ConnectionStatus isConnected={socketConnected}>
          {socketConnected ? 
            <><FiWifi size={18} /> Connected</> : 
            <><FiWifiOff size={18} /> Disconnected</>
          }
          {!socketConnected && 
            <ReconnectButton 
              whileTap={{ scale: 0.95 }} 
              onClick={handleManualReconnect}>
              <FiRefreshCw className={reconnecting ? "animate-spin" : ""} />
              Reconnect
            </ReconnectButton>
          }
        </ConnectionStatus>
        
        <User size={60} style={{ color: "#4CAF50", marginBottom: "1rem" }} />
        <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>Cook Together</h1>
        <p style={{ color: "#94A3B8", marginBottom: "1.5rem" }}>Connecting Kitchens, One Recipe at a Time</p>

        <JoinForm
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Input
            type="text"
            placeholder="Enter Room ID"
            value={roomID}
            onChange={e => setRoomID(e.target.value)}
          />
          <Button
            whileTap={{ scale: 0.95 }}
            onClick={startCall}
            disabled={!socketConnected}
          >
            Join Call
          </Button>
        </JoinForm>
      </VideoContainer>
    );
  }

  if (waitingForApproval) {
    return (
      <WaitingScreen>
        <ConnectionStatus isConnected={socketConnected} style={{ marginBottom: "1.5rem" }}>
          {socketConnected ? 
            <><FiWifi size={20} /> Connected</> : 
            <><FiWifiOff size={20} /> Disconnected</>
          }
        </ConnectionStatus>
        
        <div style={{
          animation: "spin 1s linear infinite",
          borderRadius: "50%",
          height: "3rem",
          width: "3rem",
          borderTop: "4px solid #4CAF50",
          borderRight: "4px solid transparent",
          borderBottom: "4px solid transparent",
          borderLeft: "4px solid transparent",
          marginBottom: "1rem"
        }}></div>
        <p style={{ fontSize: "1.125rem", marginBottom: "1.5rem" }}>Waiting for host to approve your request...</p>
        
        <Button
          whileTap={{ scale: 0.95 }}
          onClick={endCall}
          style={{ 
            maxWidth: "200px", 
            background: "#ef4444",
            marginTop: "1rem"
          }}
        >
          Cancel
        </Button>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </WaitingScreen>
    );
  }

  return (
    <VideoContainer ref={videoContainerRef}>
      <HeaderBar>
        <ConnectionStatus isConnected={socketConnected}>
          {socketConnected ? 
            <><FiWifi size={16} /> Connected</> : 
            <><FiWifiOff size={16} /> Disconnected</>
          }
          {!socketConnected && 
            <ReconnectButton 
              whileTap={{ scale: 0.95 }} 
              onClick={handleManualReconnect}
            >
              <FiRefreshCw className={reconnecting ? "animate-spin" : ""} size={12} />
              Reconnect
            </ReconnectButton>
          }
        </ConnectionStatus>
        <Timer>Group Call • {timer}</Timer>
        <div style={{ width: "6rem" }}></div> {/* Empty div for flex spacing */}
      </HeaderBar>
      
      <VideoGrid>
        {/* Local Video */}
        <VideoWrapper
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <VideoElement ref={localVideoRef} muted autoPlay playsInline />
          {/* Name overlay */}
          <VideoOverlay position="bottom: 0.75rem; left: 0.75rem;">
            {user?.displayName || 'You'} (You)
          </VideoOverlay>
          {/* Status indicators */}
          <VideoOverlay position="top: 0.75rem; right: 0.75rem;">
            <StatusIndicators>
              {!micOn && <FiMicOff size={14} />}
              {!videoOn && <FiVideoOff size={14} />}
            </StatusIndicators>
          </VideoOverlay>
        </VideoWrapper>

        {/* Remote Participants */}
        <AnimatePresence mode="popLayout">
          {peers.map(p => (
            <ParticipantVideo 
              key={p.peerID} 
              peer={p.peer} 
              micOn={p.micOn} 
              videoOn={p.videoOn} 
              displayName={p.user?.displayName}
              isLocal={false}
            />
          ))}
        </AnimatePresence>
      </VideoGrid>

      <ControlsBar>
        {/* Microphone Control */}
        <ControlButton 
          onClick={toggleMic} 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          variant={micOn ? 'success' : 'danger'}
          active={micOn}
          disabled={isLoading}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <FiMic /> : <FiMicOff />}
        </ControlButton>

        {/* Video Control */}
        <ControlButton 
          onClick={toggleVideo} 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          variant={videoOn ? 'success' : 'danger'}
          active={videoOn}
          disabled={isLoading}
          aria-label={videoOn ? 'Turn off camera' : 'Turn on camera'}
          title={videoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoOn ? <FiVideo /> : <FiVideoOff />}
        </ControlButton>

        {/* Screen Share */}
        <ControlButton 
          onClick={toggleScreenShare} 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          active={screenSharing}
          color={screenSharing ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : undefined}
          disabled={isLoading}
          aria-label={screenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
          title={screenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
        >
          <FiMonitor />
        </ControlButton>

        {/* Switch Camera */}
        <ControlButton 
          onClick={switchCamera} 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          disabled={isLoading || !videoOn}
          aria-label="Switch camera"
          title="Switch camera"
        >
          <FiRepeat />
        </ControlButton>

        {/* Fullscreen */}
        <ControlButton 
          onClick={toggleFullscreen} 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          aria-label="Toggle fullscreen"
          title="Toggle fullscreen"
        >
          <FiMaximize />
        </ControlButton>

        {/* Picture in Picture */}
        <ControlButton 
          onClick={togglePiP} 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          disabled={!videoOn}
          aria-label="Picture in picture"
          title="Picture in picture"
        >
          <FiExternalLink />
        </ControlButton>

        {/* Divider */}
        <div style={{
          width: '2px',
          height: '2rem',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '1px',
          margin: '0 0.5rem'
        }} />

        {/* End Call */}
        <ControlButton 
          onClick={endCall} 
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          variant="danger"
          aria-label="End call"
          title="End call"
        >
          <FiPhoneOff />
        </ControlButton>
      </ControlsBar>

      {/* Participants & Join Requests */}
      <motion.div layout className="mt-6 max-w-md mx-auto bg-gray-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><FiUsers /> <span>Participants ({peers.length + 1})</span></div>
        </div>

        {/* Participants */}
        <div className="flex flex-col gap-1 max-h-40 overflow-auto mb-2">
          <div className="flex items-center justify-between px-2 py-1 bg-gray-700 rounded">{user?.displayName || 'You'} (You) {isHost && "(Host)"}</div>
          {peers.map(p => (
            <div key={p.peerID} className="flex items-center justify-between px-2 py-1 bg-gray-700 rounded">
              <span>{p.user?.displayName || `User (${p.peerID.substring(0,6)}...)`}</span>
              {isHost && <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeParticipant(p.peerID)} className="text-red-500 font-bold">Remove</motion.button>}
            </div>
          ))}
        </div>

        {/* Join requests */}
        {isHost && joinRequests.length > 0 && (
          <div className="flex flex-col gap-1 max-h-40 overflow-auto mb-2">
            <div className="font-semibold text-yellow-400 mb-1">Pending Join Requests</div>
            {joinRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between px-2 py-1 bg-gray-700 rounded">
                <span>{req.user?.displayName || `Guest (${req.id.substring(0,6)}...)`}</span>
                <div className="flex gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => approveJoin(req.id)} className="px-2 py-0.5 rounded bg-green-500 text-white text-sm">Approve</motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => declineJoin(req.id)} className="px-2 py-0.5 rounded bg-red-500 text-white text-sm">Decline</motion.button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Room ID */}
        <div className="flex mt-2 gap-2">
          <input type="text" value={roomID} readOnly className="flex-grow px-2 py-1 rounded bg-gray-900 text-white" />
          <motion.button onClick={handleCopyRoomID} whileTap={{ scale: 0.95 }} className="px-3 py-1 rounded bg-green-500 text-white flex items-center gap-1"><FiCopy /> Copy</motion.button>
        </div>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {alertInfo.open && (
          <Alert
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {alertInfo.message}
          </Alert>
        )}
      </AnimatePresence>
    </VideoContainer>
  );
}
