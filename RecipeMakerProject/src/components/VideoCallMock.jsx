import React, { useState, useRef, useEffect } from "react";
import SimplePeer from "simple-peer";
import io from "socket.io-client";
import { useAuth } from "../hooks/useAuth"; // Assuming you have a useAuth hook
import {
    FiMic, FiMicOff, FiVideo, FiVideoOff, FiRepeat, FiMaximize,
    FiExternalLink, FiPhoneOff, FiUsers, FiCopy
} from "react-icons/fi";
import {
    Container, Grid, Card, Typography, TextField, Button,
    IconButton, Tooltip, Box, Snackbar, Alert, Accordion, AccordionSummary,
    AccordionDetails, List, ListItem, ListItemText, Paper, Dialog, DialogTitle,
    DialogContent, DialogActions, CircularProgress
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KitchenIcon from '@mui/icons-material/Kitchen';

// --- Socket.IO Connection ---
const socket = io("http://localhost:5000"); // Ensure this matches your backend server address

// --- Helper Component for Each Participant's Video ---
const ParticipantVideo = ({ peer, micOn, videoOn, displayName }) => {
    const ref = useRef();
    useEffect(() => {
        peer.on("stream", stream => {
            if (ref.current) ref.current.srcObject = stream;
        });
    }, [peer]);
    return (
        <Card sx={{ position: 'relative', height: '100%', bgcolor: 'black', borderRadius: 2 }}>
            <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            <Box sx={{ position: 'absolute', bottom: 8, left: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', p: '2px 8px', borderRadius: 1 }}>
                <Typography variant="caption">{displayName || "Guest"}</Typography>
            </Box>
            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', p: 0.5, borderRadius: 1 }}>
                {!micOn && <FiMicOff />}
                {!videoOn && <FiVideoOff />}
            </Box>
        </Card>
    );
};

// --- Main VideoRoom Component ---
export default function VideoRoom() {
    const { user } = useAuth(); // Get authenticated user
    const [roomID, setRoomID] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [waitingForApproval, setWaitingForApproval] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]); // Will now store { id, user }
    const [joined, setJoined] = useState(false);
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState([]); // Will now store { peerID, peer, user, micOn, videoOn }
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [currentCamera, setCurrentCamera] = useState("user");
    const [callStartTime, setCallStartTime] = useState(null);
    const [timer, setTimer] = useState("00:00");
    const [alertInfo, setAlertInfo] = useState({ open: false, message: "", severity: "info" });

    const localVideoRef = useRef();
    const videoContainerRef = useRef();
    const peersRef = useRef([]);

    // Timer Effect
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

    // Socket.IO and PeerJS Effect
    useEffect(() => {
        socket.on("new-join-request", ({ from, user: requesterUser }) => {
            setAlertInfo({ open: true, message: `${requesterUser.displayName} wants to join!`, severity: "info" });
            setJoinRequests(prev => [...prev, { id: from, user: requesterUser }]);
        });

        socket.on("request-accepted", () => {
            setWaitingForApproval(false);
            setJoined(true);
            setCallStartTime(Date.now());
            socket.emit("join-room", { roomID, user });
        });

        socket.on("request-declined", () => {
            setWaitingForApproval(false);
            setAlertInfo({ open: true, message: "Your request to join was declined.", severity: "error" });
            stream?.getTracks().forEach(track => track.stop());
            setStream(null);
        });

        if (joined && stream) {
            socket.on("all-users", users => { // users is now an object: { id: user }
                const newPeers = [];
                for (const userID in users) {
                    if (userID === socket.id) continue;
                    const peer = createPeer(userID, socket.id, stream);
                    peersRef.current.push({ peerID: userID, peer });
                    newPeers.push({ peerID: userID, peer, user: users[userID], micOn: true, videoOn: true });
                }
                setPeers(newPeers);
            });

            socket.on("user-joined", ({ signal, callerID, user: joiningUser }) => {
                setAlertInfo({ open: true, message: `${joiningUser.displayName} has joined the call.`, severity: "info" });
                const peer = addPeer(signal, callerID, stream);
                peersRef.current.push({ peerID: callerID, peer });
                setPeers(prevPeers => [...prevPeers, { peerID: callerID, peer, user: joiningUser, micOn: true, videoOn: true }]);
            });

            socket.on("receiving-returned-signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item?.peer.signal(payload.signal);
            });

            socket.on("user-disconnected", id => {
                const disconnectingPeer = peers.find(p => p.peerID === id);
                const displayName = disconnectingPeer?.user?.displayName || 'A user';
                setAlertInfo({ open: true, message: `${displayName} has left the call.`, severity: "warning" });
                
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if (peerObj) peerObj.peer.destroy();
                peersRef.current = peersRef.current.filter(p => p.peerID !== id);
                setPeers(prevPeers => prevPeers.filter(p => p.peerID !== id));
            });

            socket.on("user-toggled-mic", ({ userID, micOn }) => setPeers(prev => prev.map(p => p.peerID === userID ? { ...p, micOn } : p)));
            socket.on("user-toggled-video", ({ userID, videoOn }) => setPeers(prev => prev.map(p => p.peerID === userID ? { ...p, videoOn } : p)));
        }

        return () => {
            socket.off("new-join-request");
            socket.off("request-accepted");
            socket.off("request-declined");
            socket.off("all-users");
            socket.off("user-joined");
            socket.off("receiving-returned-signal");
            socket.off("user-disconnected");
            socket.off("user-toggled-mic");
            socket.off("user-toggled-video");
        }; 
    }, [joined, stream, roomID, user, peers]);

    // Peer Creation Functions
    function createPeer(userToSignal, callerID, stream) {
        const peer = new SimplePeer({ initiator: true, trickle: false, stream });
        peer.on("signal", signal => socket.emit("sending-signal", { userToSignal, callerID, signal }));
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new SimplePeer({ initiator: false, trickle: false, stream });
        peer.on("signal", signal => socket.emit("returning-signal", { signal, callerID }));
        peer.signal(incomingSignal);
        return peer;
    }

    // Core Functions
    const startCall = async () => {
        if (!roomID) {
            setAlertInfo({ open: true, message: "Please enter a Room ID.", severity: "error" });
            return;
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentCamera }, audio: true });
            setStream(mediaStream);
            if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
            
            socket.emit("check-room", roomID, (roomExists) => {
                if (roomExists) {
                    socket.emit("request-to-join", { roomID, user });
                    setWaitingForApproval(true);
                } else {
                    socket.emit("create-room", { roomID, user });
                    setIsHost(true);
                    setJoined(true);
                    setCallStartTime(Date.now());
                }
            });

        } catch (err) {
            console.error("Media access error:", err);
            setAlertInfo({ open: true, message: "Could not access camera and microphone.", severity: "error" });
        }
    };

    const handleRequestResponse = (requesterId, accepted) => {
        socket.emit("respond-to-request", { to: requesterId, roomID, accepted });
        setJoinRequests(prev => prev.filter(req => req.id !== requesterId));
    };

    const endCall = () => {
        setJoined(false);
        setIsHost(false);
        setWaitingForApproval(false);
        setCallStartTime(null);
        setTimer("00:00");
        stream?.getTracks().forEach(track => track.stop());
        peers.forEach(p => p.peer.destroy());
        setPeers([]);
        peersRef.current = [];
        socket.emit("leave-room", roomID);
        setAlertInfo({ open: true, message: "You have left the call.", severity: "info" });
    };
    
    // Control Toggles
    const toggleMic = () => {
        const newMicOn = !micOn;
        stream?.getAudioTracks().forEach(track => (track.enabled = newMicOn));
        setMicOn(newMicOn);
        socket.emit("toggle-mic", { roomID, micOn: newMicOn });
    };

    const toggleVideo = () => {
        const newVideoOn = !videoOn;
        stream?.getVideoTracks().forEach(track => (track.enabled = newVideoOn));
        setVideoOn(newVideoOn);
        socket.emit("toggle-video", { roomID, videoOn: newVideoOn });
    };

    const switchCamera = async () => {
        if (!stream) return;
        const newFacing = currentCamera === "user" ? "environment" : "user";
        stream.getTracks().forEach(t => t.stop());
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing }, audio: true });
            setStream(newStream);
            setCurrentCamera(newFacing);
            if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
    
            const oldVideoTrack = stream.getVideoTracks()[0];
            const newVideoTrack = newStream.getVideoTracks()[0];
            peersRef.current.forEach(({ peer }) => {
                peer.replaceTrack(oldVideoTrack, newVideoTrack, stream);
            });
            setAlertInfo({ open: true, message: `Switched to ${newFacing} camera`, severity: "info" });
        } catch (err) {
            console.error("Camera switch error:", err);
            setAlertInfo({ open: true, message: "Could not switch camera.", severity: "error" });
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoContainerRef.current?.requestFullscreen().catch(err => {
                setAlertInfo({ open: true, message: `Error entering fullscreen: ${err.message}`, severity: "error" });
            });
        } else {
            document.exitFullscreen();
        }
    };

    const togglePiP = async () => {
        if (localVideoRef.current && document.pictureInPictureEnabled && !localVideoRef.current.disablePictureInPicture) {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await localVideoRef.current.requestPictureInPicture();
                }
            } catch (err) {
                console.error("PiP error:", err);
                setAlertInfo({ open: true, message: "Picture-in-Picture failed.", severity: "error" });
            }
        }
    };
    
    const handleCopyRoomID = () => {
        navigator.clipboard.writeText(roomID);
        setAlertInfo({ open: true, message: "Room ID copied to clipboard!", severity: "success" });
    };
    

    // --- UI Rendering ---
    if (!joined && !waitingForApproval) {
        return (
             <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center',background: 'linear-gradient(to bottom right, #161825, #1d1f31, #161825)' }}>
                <KitchenIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold'}}>Cook Together</Typography>
                <Typography variant="h6" sx={{ color: 'grey.400', mb: 2 }}>Connecting Kitchens, One Recipe at a Time</Typography>
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'transparent', borderRadius: 3, width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <TextField fullWidth variant="outlined" label="Enter Room ID to Join or Create" value={roomID} onChange={e => setRoomID(e.target.value)} sx={{ mb: 2, input: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'gray' } }, '& .MuiInputLabel-root': { color: 'gray' } }} />
                    <Button variant="contained" onClick={startCall} size="large" fullWidth>Join Call</Button>
                </Paper>
            </Container>
        );
    }
    
    if (waitingForApproval) {
        return (
            <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white' }}>
                <CircularProgress color="primary" />
                <Typography variant="h6" sx={{ mt: 2 }}>Waiting for host to approve your request...</Typography>
            </Container>
        );
    }

    return (
        <Box ref={videoContainerRef} sx={{color: 'white', p: 2, minHeight: '100vh', boxShadow: 10, mb: '10px', pb: '10px', borderRadius: '0.5rem',  background: 'linear-gradient(to bottom right, #161825, #1d1f31, #161825)' }}>
            <Dialog open={joinRequests.length > 0} onClose={() => {}} PaperProps={{ sx: { bgcolor: 'grey.800', color: 'white' } }}>
                <DialogTitle>Incoming Join Requests</DialogTitle>
                <DialogContent>
                    {joinRequests.map(req => (
                        <Box key={req.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, mb: 1, bgcolor: 'grey.700', borderRadius: 1 }}>
                            <Typography>{req.user?.displayName || 'A user'} wants to join.</Typography>
                            <DialogActions>
                                <Button onClick={() => handleRequestResponse(req.id, false)} color="error">Decline</Button>
                                <Button onClick={() => handleRequestResponse(req.id, true)} variant="contained" color="success">Accept</Button>
                            </DialogActions>
                        </Box>
                    ))}
                </DialogContent>
            </Dialog>

            <Typography variant="h5" align="center" sx={{ mb: 2 }}>Group Call • {timer}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ position: 'relative', height: '100%', bgcolor: 'black', borderRadius: 2 }}>
                         <video ref={localVideoRef} muted autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                         <Box sx={{ position: 'absolute', bottom: 8, left: 8, color: 'white', bgcolor: 'rgba(0, 0, 0, 1)', p: '2px 8px', borderRadius: 1 }}><Typography variant="caption">{user?.displayName || "You"}</Typography></Box>
                         <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 2, bgcolor: 'rgba(255, 255, 255, 1)', p: 1.5, borderRadius: 1 }}>
                             {!micOn && <FiMicOff />}
                             {!videoOn && <FiVideoOff />}
                         </Box>
                    </Card>
                </Grid>
                {peers.map(p => (
                    <Grid item xs={12} sm={6} md={4} key={p.peerID}>
                        <ParticipantVideo peer={p.peer} micOn={p.micOn} videoOn={p.videoOn} displayName={p.user?.displayName} />
                    </Grid>
                ))}
            </Grid>

            {/* Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, flexWrap: 'wrap', p: 1, bgcolor: 'rgba(0, 0, 0, 0)', borderRadius: '50px' }}>
                <Tooltip title={micOn ? "Mute Mic" : "Unmute Mic"}><IconButton onClick={toggleMic} sx={{ bgcolor: micOn ? 'success.main' : 'error.main', color: 'white', '&:hover': { bgcolor: micOn ? 'success.dark' : 'error.dark' } }}>{micOn ? <FiMic /> : <FiMicOff />}</IconButton></Tooltip>
                <Tooltip title={videoOn ? "Turn Off Video" : "Turn On Video"}><IconButton onClick={toggleVideo} sx={{ bgcolor: videoOn ? 'success.main' : 'error.main', color: 'white', '&:hover': { bgcolor: videoOn ? 'success.dark' : 'error.dark' } }}>{videoOn ? <FiVideo /> : <FiVideoOff />}</IconButton></Tooltip>
                <Tooltip title="Switch Camera"><IconButton onClick={switchCamera} sx={{ bgcolor: 'info.main', color: 'white', '&:hover': { bgcolor: 'info.dark' } }}><FiRepeat /></IconButton></Tooltip>
                <Tooltip title="Fullscreen"><IconButton onClick={toggleFullscreen} sx={{ bgcolor: 'warning.main', color: 'white', '&:hover': { bgcolor: 'warning.dark' } }}><FiMaximize /></IconButton></Tooltip>
                <Tooltip title="Picture-in-Picture"><IconButton onClick={togglePiP} sx={{ bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' } }}><FiExternalLink /></IconButton></Tooltip>
                <Tooltip title="End Call"><IconButton onClick={endCall} sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}><FiPhoneOff /></IconButton></Tooltip>
            </Box>

            {/* Participants Panel */}
            <Accordion sx={{ bgcolor: 'grey.800', color: 'white', mt: 4, maxWidth: '400px', mx: 'auto', mb: 5, borderRadius: 2, '&.Mui-expanded': { margin: '32px auto 0 auto' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}><FiUsers /><Typography sx={{ ml: 1 }}>Participants ({peers.length + 1})</Typography></AccordionSummary>
                <AccordionDetails>
                    <List dense>
                        <ListItem><ListItemText primary={`${user?.displayName || 'You'} ${isHost ? '(Host)' : ''}`} /></ListItem>
                        {peers.map(p => (<ListItem key={p.peerID}><ListItemText primary={p.user?.displayName || `User (${p.peerID.substring(0,6)}...)`} /></ListItem>))}
                    </List>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <TextField size="small" value={roomID} readOnly sx={{ flexGrow: 1, input: { color: 'white' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'gray' } } }} />
                        <Button variant="contained" size="small" onClick={handleCopyRoomID} startIcon={<FiCopy />}>Copy</Button>
                    </Box>
                </AccordionDetails>
            </Accordion>

            <Snackbar open={alertInfo.open} autoHideDuration={4000} onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setAlertInfo(prev => ({ ...prev, open: false }))} severity={alertInfo.severity} sx={{ width: '100%' }}>{alertInfo.message}</Alert>
            </Snackbar>
        </Box>
    );
}
