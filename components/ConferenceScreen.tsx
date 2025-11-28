// // import React, { useState, useEffect, useRef } from "react";
// // import { ConnectionState, Participant } from "../types";
// // import ControlBar from "./ControlBar";
// // import ParticipantGrid from "./ParticipantGrid";
// // import ParticipantListSidebar from "./ParticipantListSidebar";
// // import { SignalIcon, SignalOffIcon } from "./Icons";

// // interface ConferenceScreenProps {
// //   conferenceId: string;
// //   userName: string;
// //   onLeave: () => void;
// // }

// // const ConferenceScreen: React.FC<ConferenceScreenProps> = ({
// //   conferenceId,
// //   userName,
// //   onLeave,
// // }) => {
// //   const [isMuted, setIsMuted] = useState(false);
// //   const [participants, setParticipants] = useState<Participant[]>([]);
// //   const [connectionState, setConnectionState] = useState<ConnectionState>("Initializing...");
// //   const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
// //   const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  
// //   // Error and Status States
// //   const [errorMsg, setErrorMsg] = useState<string | null>(null);
// //   const [warningMsg, setWarningMsg] = useState<string | null>(null);
// //   const [autoplayBlocked, setAutoplayBlocked] = useState(false);

// //   // Diagnostics State
// //   const [showStatusModal, setShowStatusModal] = useState(false);
// //   const [diagnostics, setDiagnostics] = useState({
// //       sipStatus: 'Unknown',
// //       transportStatus: 'Unknown',
// //       micStatus: 'Unknown'
// //   });

// //   // Refs for WebRTC/SIP objects
// //   const remoteAudioRef = useRef<HTMLAudioElement>(null);
// //   const uaRef = useRef<any>(null);
// //   const sessionRef = useRef<any>(null);
// //   const audioContextRef = useRef<AudioContext | null>(null);
// //   const analyserRef = useRef<AnalyserNode | null>(null);
// //   const rafRef = useRef<number | null>(null);
// //   const mediaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
// //   // Race Condition Management
// //   // attemptRef tracks the ID of the latest connection attempt. 
// //   // If an async operation finishes and the ID doesn't match, we abort.
// //   const attemptRef = useRef(0);
// //   const reconnectAttemptsRef = useRef(0);

// //   // Initialize Participants List
// //   useEffect(() => {
// //     setParticipants([
// //       {
// //         id: "local-user",
// //         name: userName,
// //         isMuted: isMuted,
// //         isSpeaking: false, 
// //         isLocal: true,
// //       }
// //     ]);
// //   }, [userName, conferenceId, isMuted, isRemoteSpeaking]);

// //   // Global Audio Context Resume (Fix for "Voice not coming" in production)
// //   useEffect(() => {
// //     const resumeAudio = () => {
// //       if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
// //         audioContextRef.current.resume().catch(e => console.warn("Failed to auto-resume audio context:", e));
// //       }
// //     };
// //     document.addEventListener('click', resumeAudio);
// //     document.addEventListener('touchstart', resumeAudio);
// //     return () => {
// //       document.removeEventListener('click', resumeAudio);
// //       document.removeEventListener('touchstart', resumeAudio);
// //     };
// //   }, []);

// //   // Async cleanup to ensure UA stops completely
// //   const cleanup = async () => {
// //     if (rafRef.current) {
// //         cancelAnimationFrame(rafRef.current);
// //         rafRef.current = null;
// //     }
// //     if (mediaTimeoutRef.current) {
// //         clearTimeout(mediaTimeoutRef.current);
// //         mediaTimeoutRef.current = null;
// //     }
    
// //     if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
// //         audioContextRef.current.close().catch(e => console.warn("Error closing audio context", e));
// //     }
    
// //     if (sessionRef.current) {
// //         try {
// //             if (sessionRef.current.state === 'Established' || sessionRef.current.state === 'Establishing') {
// //                  sessionRef.current.bye(); 
// //             } else if (sessionRef.current.state === 'Initial') {
// //                  sessionRef.current.cancel();
// //             }
// //         } catch (e) {
// //             console.warn("Session cleanup error:", e);
// //         }
// //         sessionRef.current = null;
// //     }
    
// //     if (uaRef.current) {
// //         try {
// //             // Ensure we stop the UserAgent to close WebSocket connections
// //             if (uaRef.current.status !== 'Stopped') {
// //               await uaRef.current.stop();
// //               console.log("SIP UA Stopped");
// //             }
// //         } catch (e) {
// //             console.warn("UA stop error:", e);
// //         }
// //         uaRef.current = null;
// //     }
// //   };

// //   const ensureSIPLoaded = async (): Promise<boolean> => {
// //     const checkGlobal = () => !!(window as any).SIP;
// //     if (checkGlobal()) return true;

// //     const waitForGlobal = async (duration: number) => {
// //         const start = Date.now();
// //         while (Date.now() - start < duration) {
// //             if (checkGlobal()) return true;
// //             await new Promise(r => setTimeout(r, 100));
// //         }
// //         return false;
// //     };

// //     console.log("Checking for pre-loaded SIP.js...");
// //     if (await waitForGlobal(2000)) return true;

// //     console.warn("Initial load failed. Initiating fallback sequence...");

// //     const umdSources = [
// //         "https://cdnjs.cloudflare.com/ajax/libs/sip.js/0.21.2/sip.min.js",
// //         "https://cdn.jsdelivr.net/npm/sip.js@0.21.2/dist/sip.min.js", 
// //         "https://unpkg.com/sip.js@0.21.2/dist/sip.min.js"
// //     ];

// //     const injectScript = (src: string) => new Promise<void>((resolve, reject) => {
// //         if (document.querySelector(`script[src="${src}"]`)) {
// //              resolve(); 
// //              return;
// //         }
// //         const script = document.createElement('script');
// //         script.src = src;
// //         script.async = true;
// //         script.onload = () => resolve();
// //         script.onerror = (e) => reject(e);
// //         document.head.appendChild(script);
// //     });

// //     for (const src of umdSources) {
// //         try {
// //             console.log(`Attempting UMD Fallback: ${src}`);
// //             await injectScript(src);
// //             if (await waitForGlobal(1500)) {
// //                 console.log(`Success: Loaded SIP.js via ${src}`);
// //                 return true;
// //             }
// //         } catch (e) {
// //             console.warn(`Failed UMD Fallback: ${src}`);
// //         }
// //     }

// //     try {
// //         console.log("Attempting ESM Import Fallback (esm.sh)...");
// //         // @ts-ignore
// //         const module = await import(/* @vite-ignore */ "https://esm.sh/sip.js@0.21.2");
// //         if (module && (module.UserAgent || module.default?.UserAgent)) {
// //             (window as any).SIP = module.default || module;
// //             console.log("Success: Loaded SIP.js via ESM");
// //             return true;
// //         }
// //     } catch (e) {
// //         console.warn("ESM Fallback failed:", e);
// //     }
    
// //     return checkGlobal();
// //   };

// //   const handleConnect = async () => {
// //       // Increment attempt counter. This ID is unique to THIS execution of handleConnect.
// //       const currentAttemptId = ++attemptRef.current;
      
// //       await cleanup();
      
// //       // Abort if a new attempt started while we were cleaning up
// //       if (currentAttemptId !== attemptRef.current) return;

// //       setErrorMsg(null);
// //       setWarningMsg(null);
// //       setConnectionState("Initializing...");

// //       try {
// //         // 1) SIP.js availability check
// //         const sipLoaded = await ensureSIPLoaded();
// //         if (currentAttemptId !== attemptRef.current) return; // Abort check

// //         if (!sipLoaded) {
// //           setErrorMsg("SIP.js failed to load. Your network may be blocking libraries.");
// //           return;
// //         }
        
// //         const SIP = (window as any).SIP;

// //         // 2) Secure Context & Mic support check
// //         if (!window.isSecureContext) {
// //            setErrorMsg("Insecure Context Detected. Please use 'localhost' or setup HTTPS.");
// //            return;
// //         }

// //         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
// //           setErrorMsg("Microphone access is not supported in this browser.");
// //           return;
// //         }

// //         setConnectionState("Requesting Mic...");

// //         // 3) Request mic
// //         try {
// //           const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// //           stream.getTracks().forEach((t) => t.stop());
// //         } catch (err: any) {
// //           if (currentAttemptId !== attemptRef.current) return; // Abort check
// //           setConnectionState("Error");
// //           if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
// //               setErrorMsg("Microphone permission denied. Please allow microphone access.");
// //           } else {
// //               setErrorMsg(`Failed to access microphone: ${err.message}`);
// //           }
// //           return;
// //         }

// //         setConnectionState("Connecting to Server...");
// //         if (currentAttemptId !== attemptRef.current) return;

// //         // 4) SIP Config
// //         const server = "wss://cognicx.callanywhere.co.in:8089/ws";
// //         const domain = "cognicx.callanywhere.co.in";
// //         const user = "webconf";
// //         const pass = "webconf";

// //         const uri = SIP.UserAgent.makeURI(`sip:${user}@${domain}`);
// //         if (!uri) {
// //             setErrorMsg("Invalid SIP configuration.");
// //             return;
// //         }

// //         const ua = new SIP.UserAgent({
// //           uri,
// //           authorizationUsername: user,
// //           authorizationPassword: pass,
// //           transportOptions: { 
// //             server: server, 
// //             traceSip: true,
// //             connectionTimeout: 10,
// //             keepAliveInterval: 30
// //           },
// //           sessionDescriptionHandlerFactoryOptions: {
// //             constraints: {
// //               audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, 
// //               video: false,
// //             },
// //           },
// //           register: false, 
// //           userAgentString: 'Cognicx Meet Client',
// //         });

// //         uaRef.current = ua;

// //         ua.transport.stateChange.addListener((state: any) => {
// //           console.log("Transport State:", state);
// //           // Only react to transport changes if this UA is still the active one
// //           if (currentAttemptId !== attemptRef.current) return;
          
// //           if (state === "Disconnected") {
// //              if (connectionState !== "Terminated" && connectionState !== "Error") {
// //                 if (reconnectAttemptsRef.current < 3) {
// //                     setWarningMsg(`Connection lost. Reconnecting (Attempt ${reconnectAttemptsRef.current + 1}/3)...`);
// //                     reconnectAttemptsRef.current += 1;
// //                     setTimeout(() => {
// //                         if (uaRef.current && uaRef.current.transport.state === "Disconnected") {
// //                              uaRef.current.transport.connect().catch((e: any) => console.warn("Reconnection failed", e));
// //                         }
// //                     }, 2000);
// //                 } else {
// //                     setWarningMsg(null);
// //                     setConnectionState("Error");
// //                     setErrorMsg("Lost connection to the server. Please retry.");
// //                 }
// //              }
// //           } else if (state === "Connected") {
// //              setWarningMsg(null);
// //              reconnectAttemptsRef.current = 0;
// //           }
// //         });

// //         try {
// //             await ua.start();
// //         } catch (err: any) {
// //             if (currentAttemptId !== attemptRef.current) return;
// //             console.error("UA Start Failed:", err);
// //             setConnectionState("Error");
// //             setErrorMsg("Could not connect to SIP server. Firewall or SSL/WSS issue detected.");
// //             return;
// //         }
        
// //         if (currentAttemptId !== attemptRef.current) {
// //             ua.stop();
// //             return;
// //         }
        
// //         setConnectionState("Calling...");

// //         // 5) Create Invite
// //         const targetURI = SIP.UserAgent.makeURI(`sip:webconf@${domain}`);
// //         if (!targetURI) {
// //            setErrorMsg("Invalid Target URI");
// //            return;
// //         }

// //         // Define headers in the Inviter constructor options.
// //         // This ensures they are part of the session and sent with the initial INVITE.
// //         const inviter = new SIP.Inviter(ua, targetURI, {
// //           sessionDescriptionHandlerOptions: {
// //             constraints: { audio: true, video: false },
// //           },
// //           extraHeaders: [
// //               `X-Meeting-Id: ${conferenceId.trim()}`,
// //               `X-Caller-Name: ${userName.trim()}`
// //           ]
// //         });

// //         sessionRef.current = inviter;
// //         setupSessionListeners(inviter, currentAttemptId);

// //         inviter.invite()
// //           .then(() => console.log("Invite sent successfully"))
// //           .catch((e: any) => {
// //             if (currentAttemptId !== attemptRef.current) return;
// //             console.error("Invite failed", e);
// //             setConnectionState("Error");
// //             setErrorMsg("Failed to connect to conference: " + (e.message || "Unknown error"));
// //           });

// //       } catch (err: any) {
// //         if (currentAttemptId !== attemptRef.current) return;
// //         console.error("WebRTC / SIP Error:", err);
// //         setConnectionState("Error");
// //         setErrorMsg(err.message || "Connection failed unexpectedly");
// //       }
// //   };

// //   const checkSipConnection = () => {
// //       let sip = 'Disconnected';
// //       let transport = 'Unknown';
// //       let mic = 'Unknown';
// //       const SIP = (window as any).SIP;

// //       if (uaRef.current && SIP) {
// //           sip = uaRef.current.isConnected() ? 'Connected' : 'Disconnected';
// //       } else {
// //           sip = 'Not Initialized';
// //       }

// //       if (sessionRef.current && sessionRef.current.sessionDescriptionHandler) {
// //           const pc = sessionRef.current.sessionDescriptionHandler.peerConnection;
// //           if (pc) {
// //              transport = pc.connectionState; 
// //           } else {
// //              transport = 'No Peer Connection';
// //           }
// //       } else {
// //           transport = 'No Active Session';
// //       }

// //       if (!window.isSecureContext) {
// //           mic = 'Insecure Context (Failed)';
// //       } else if (connectionState === 'Error' && errorMsg?.includes('Microphone')) {
// //           mic = 'Blocked/Missing';
// //       } else if (audioContextRef.current && audioContextRef.current.state === 'running') {
// //           mic = 'Active';
// //       } else {
// //           mic = 'Granted (Idle)';
// //       }

// //       setDiagnostics({ sipStatus: sip, transportStatus: transport, micStatus: mic });
// //       setShowStatusModal(true);
// //   };

// //   const handleRetry = () => {
// //     reconnectAttemptsRef.current = 0;
// //     setShowStatusModal(false);
// //     handleConnect();
// //   };

// //   useEffect(() => {
// //     handleConnect();

// //     return () => {
// //         // Incrementing attemptRef on unmount ensures any pending async ops 
// //         // from the effect that is cleaning up will abort.
// //         attemptRef.current += 1;
// //         cleanup();
// //     };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [conferenceId, userName]);

// //   const setupSessionListeners = (inviter: any, myAttemptId: number) => {
// //     inviter.stateChange.addListener((state: any) => {
// //       if (myAttemptId !== attemptRef.current) return;
// //       console.log("SIP Session State:", state);

// //       switch (state) {
// //         case "Initial":
// //           setConnectionState("Initializing...");
// //           break;
// //         case "Establishing":
// //           setConnectionState("Calling...");
// //           break;
// //         case "Established":
// //           setConnectionState("Connected");
// //           handleRemoteStream(inviter);
// //           if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
// //           mediaTimeoutRef.current = setTimeout(() => {
// //               if (!remoteAudioRef.current?.srcObject) {
// //                   setWarningMsg("Connected, but no audio received yet.");
// //               }
// //           }, 8000);
// //           break;
// //         case "Terminated":
// //           setConnectionState("Terminated");
// //           if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
// //           setTimeout(() => {
// //             if (myAttemptId === attemptRef.current) onLeave();
// //           }, 1000);
// //           break;
// //         default:
// //           break;
// //       }
// //     });

// //     inviter.delegate = {
// //         onProgress: (response: any) => {
// //             if (myAttemptId !== attemptRef.current) return;
// //             console.log("Call Progress (Early Media)");
// //             checkAndAttachMedia(inviter);
// //         },
// //         onAccept: (response: any) => {
// //             if (myAttemptId !== attemptRef.current) return;
// //             console.log("Call Accepted");
// //             checkAndAttachMedia(inviter);
// //         }
// //     };
// //   };

// //   const checkAndAttachMedia = (inviter: any) => {
// //       if (!inviter.sessionDescriptionHandler) return;
      
// //       const pc = inviter.sessionDescriptionHandler.peerConnection;
// //       if (!pc) return;

// //       if (!pc.hasAttachedConnectionState) {
// //           pc.addEventListener('connectionstatechange', () => {
// //               console.log("ICE Connection State:", pc.connectionState);
// //               if (pc.connectionState === 'failed') {
// //                   setErrorMsg("Network firewall blocking connection (ICE Failed).");
// //               } else if (pc.connectionState === 'disconnected') {
// //                   setWarningMsg("Connection interrupted. Reconnecting...");
// //               } else if (pc.connectionState === 'connected') {
// //                   setWarningMsg(null);
// //               }
// //           });
// //           pc.hasAttachedConnectionState = true;
// //       }

// //       const receivers = pc.getReceivers();
// //       const audioReceiver = receivers.find((r: any) => r.track && r.track.kind === 'audio');
// //       if (audioReceiver && audioReceiver.track) {
// //           attachStream(new MediaStream([audioReceiver.track]));
// //       }

// //       if (!pc.hasAttachedOntrack) {
// //           pc.ontrack = (event: any) => {
// //               if (event.streams && event.streams[0]) {
// //                   attachStream(event.streams[0]);
// //               } else if (event.track) {
// //                   attachStream(new MediaStream([event.track]));
// //               }
// //           };
// //           pc.hasAttachedOntrack = true;
// //       }
// //   };

// //   const handleRemoteStream = (inviter: any) => {
// //      checkAndAttachMedia(inviter);
// //   };

// //   const attachStream = (stream: MediaStream) => {
// //       if (mediaTimeoutRef.current) {
// //           clearTimeout(mediaTimeoutRef.current);
// //           mediaTimeoutRef.current = null;
// //       }
// //       setWarningMsg(null);

// //       if (remoteAudioRef.current) {
// //           // Check if we are already playing this exact track to avoid resetting playback
// //           const newTrackId = stream.getAudioTracks()[0]?.id;
// //           const currentSrc = remoteAudioRef.current.srcObject as MediaStream;
// //           const currentTrackId = currentSrc?.getAudioTracks()[0]?.id;

// //           if (!currentSrc || currentTrackId !== newTrackId) {
// //             console.log("Attaching new audio stream ID:", newTrackId);
// //             remoteAudioRef.current.srcObject = stream;
// //             remoteAudioRef.current.muted = false;
// //             remoteAudioRef.current.volume = 1.0;
            
// //             const playPromise = remoteAudioRef.current.play();
// //             if (playPromise !== undefined) {
// //                 playPromise
// //                 .then(() => {
// //                     setAutoplayBlocked(false);
// //                     setWarningMsg(null);
// //                     console.log("Audio playback started successfully");
// //                 })
// //                 .catch(e => {
// //                     console.error("Audio playback error:", e);
// //                     if (e.name === "NotAllowedError") {
// //                         setAutoplayBlocked(true);
// //                         setWarningMsg("Browser blocked audio. Click 'Start Audio' to listen.");
// //                     } else {
// //                         setWarningMsg("Playback error: " + e.message);
// //                     }
// //                 });
// //             }
            
// //             setupAudioAnalysis(stream);
// //           }
// //       }
// //   };

// //   const setupAudioAnalysis = (stream: MediaStream) => {
// //       try {
// //           const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          
// //           // If context doesn't exist or was closed, create new one
// //           if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
// //               audioContextRef.current = new AudioContextClass();
// //           }

// //           const ctx = audioContextRef.current;
          
// //           // Attempt to resume if suspended (common browser policy)
// //           if (ctx.state === 'suspended') {
// //               ctx.resume().catch(e => console.warn("Failed to resume audio context", e));
// //           }

// //           // Don't reconnect if we already have an analyser
// //           if (analyserRef.current) return;

// //           const src = ctx.createMediaStreamSource(stream);
// //           const analyser = ctx.createAnalyser();
// //           analyser.fftSize = 256;
// //           analyser.smoothingTimeConstant = 0.5; 
// //           src.connect(analyser);
// //           analyserRef.current = analyser;

// //           const data = new Uint8Array(analyser.frequencyBinCount);

// //           const detect = () => {
// //               if (!analyserRef.current) return;
// //               analyserRef.current.getByteFrequencyData(data);
              
// //               let sum = 0;
// //               for(let i = 0; i < data.length; i++) {
// //                   sum += data[i];
// //               }
// //               const avg = sum / data.length;
              
// //               setIsRemoteSpeaking(avg > 10);
// //               rafRef.current = requestAnimationFrame(detect);
// //           };
// //           detect();

// //       } catch (e) {
// //           console.error("Audio Analysis Setup Error", e);
// //       }
// //   };

// //   const toggleMute = () => {
// //     const session = sessionRef.current;
// //     if (!session) return;

// //     let pc = null;
// //     if (session.sessionDescriptionHandler) {
// //         pc = session.sessionDescriptionHandler.peerConnection;
// //     }
    
// //     if (!pc) return;

// //     const senders = pc.getSenders();
// //     const audioSender = senders.find((s: any) => s.track && s.track.kind === 'audio');

// //     if (audioSender && audioSender.track) {
// //         const newEnabled = !audioSender.track.enabled;
// //         audioSender.track.enabled = newEnabled;
// //         setIsMuted(!newEnabled);
// //     } else {
// //         setWarningMsg("Microphone track not found.");
// //         setTimeout(() => setWarningMsg(null), 3000);
// //     }
// //   };

// //   const handleEnableAudio = () => {
// //       if (remoteAudioRef.current) {
// //           remoteAudioRef.current.muted = false;
// //           remoteAudioRef.current.volume = 1.0;
// //           remoteAudioRef.current.play()
// //             .then(() => {
// //                 setAutoplayBlocked(false);
// //                 setWarningMsg(null);
// //                 // Also try to resume context if user clicked interaction button
// //                 if (audioContextRef.current?.state === 'suspended') {
// //                     audioContextRef.current.resume();
// //                 }
// //             })
// //             .catch(e => console.error("Still failed to play:", e));
// //       }
// //   };

// //   return (
// //     <div className="w-full h-screen bg-[#202124] flex flex-col relative overflow-hidden">
// //       {/* Audio Element: Opacity 0 instead of display:none to ensure browsers prioritize playback */}
// //       <audio 
// //         ref={remoteAudioRef} 
// //         autoPlay 
// //         playsInline 
// //         style={{ position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none' }} 
// //       />

// //       {errorMsg && (
// //           <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4">
// //             <div className="bg-red-600/95 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-red-400 max-w-2xl w-full">
// //                 <div className="flex-1">
// //                     <p className="font-bold uppercase text-xs tracking-wider opacity-90 mb-1">Connection Error</p>
// //                     <p className="text-sm md:text-base font-medium">{errorMsg}</p>
// //                 </div>
// //                 <div className="flex gap-2">
// //                   <button onClick={handleRetry} className="p-2 hover:bg-white/20 rounded-full transition font-bold px-4 bg-white/10 border border-white/20">RETRY</button>
// //                   <button onClick={() => setErrorMsg(null)} className="p-2 hover:bg-white/10 rounded-full transition font-bold px-4 text-sm opacity-80">DISMISS</button>
// //                 </div>
// //             </div>
// //           </div>
// //       )}

// //       {warningMsg && !autoplayBlocked && (
// //           <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4">
// //              <div className="bg-yellow-600/95 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-yellow-400 max-w-2xl w-full">
// //                  <div className="flex-1">
// //                     <p className="font-bold uppercase text-xs tracking-wider opacity-90 mb-1">Notice</p>
// //                     <p className="text-sm md:text-base font-medium">{warningMsg}</p>
// //                  </div>
// //                  <button onClick={() => setWarningMsg(null)} className="p-2 hover:bg-white/10 rounded-full transition font-bold px-4 bg-white/10">OK</button>
// //              </div>
// //           </div>
// //       )}

// //       {autoplayBlocked && (
// //         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
// //             <div className="text-center p-8 bg-[#3c4043] rounded-2xl shadow-2xl border border-gray-600 max-w-md">
// //                 <h3 className="text-2xl font-bold mb-4 text-[#8ab4f8]">Enable Audio</h3>
// //                 <p className="mb-8 text-gray-300 text-lg">Your browser has blocked audio autoplay. Click the button below to join the conversation.</p>
// //                 <button 
// //                     onClick={handleEnableAudio}
// //                     className="px-8 py-4 bg-[#8ab4f8] text-[#202124] font-bold text-lg rounded-full hover:bg-[#a6c8ff] transition transform hover:scale-105 shadow-lg"
// //                 >
// //                     Start Audio
// //                 </button>
// //             </div>
// //         </div>
// //       )}

// //       {showStatusModal && (
// //         <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowStatusModal(false)}>
// //           <div className="bg-[#303134] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700" onClick={e => e.stopPropagation()}>
// //             <div className="p-4 border-b border-gray-700 flex justify-between items-center">
// //               <h3 className="text-lg font-medium text-white">Connection Health</h3>
// //               <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-white">✕</button>
// //             </div>
// //             <div className="p-6 space-y-6">
// //               <div className="flex items-center justify-between">
// //                 <div className="flex items-center gap-3">
// //                    <div className={`p-2 rounded-full ${diagnostics.sipStatus === 'Connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
// //                       {diagnostics.sipStatus === 'Connected' ? <SignalIcon className="w-5 h-5" /> : <SignalOffIcon className="w-5 h-5" />}
// //                    </div>
// //                    <div>
// //                      <p className="text-sm text-gray-300 font-medium">SIP Server</p>
// //                      <p className="text-xs text-gray-500">{diagnostics.sipStatus}</p>
// //                    </div>
// //                 </div>
// //               </div>

// //                <div className="flex items-center justify-between">
// //                 <div className="flex items-center gap-3">
// //                    <div className={`p-2 rounded-full ${diagnostics.transportStatus === 'connected' ? 'bg-green-500/20 text-green-400' : (diagnostics.transportStatus === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')}`}>
// //                       <SignalIcon className="w-5 h-5" />
// //                    </div>
// //                    <div>
// //                      <p className="text-sm text-gray-300 font-medium">Media Transport (ICE)</p>
// //                      <p className="text-xs text-gray-500 capitalize">{diagnostics.transportStatus}</p>
// //                    </div>
// //                 </div>
// //               </div>

// //               <div className="flex items-center justify-between">
// //                   <div className="flex items-center gap-3">
// //                       <div className={`p-2 rounded-full ${diagnostics.micStatus === 'Active' ? 'bg-green-500/20 text-green-400' : (diagnostics.micStatus === 'Blocked/Missing' || diagnostics.micStatus.includes('Insecure') ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')}`}>
// //                           <SignalIcon className="w-5 h-5" />
// //                       </div>
// //                       <div>
// //                           <p className="text-sm text-gray-300 font-medium">Microphone</p>
// //                           <p className="text-xs text-gray-500">{diagnostics.micStatus}</p>
// //                       </div>
// //                   </div>
// //               </div>

// //               <div className="pt-2 flex gap-3">
// //                 <button onClick={handleRetry} className="flex-1 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] py-2 rounded font-medium transition-colors">
// //                   {diagnostics.sipStatus !== 'Connected' ? 'Retry Connection' : 'Reconnect'}
// //                 </button>
// //                 <button onClick={() => setShowStatusModal(false)} className="flex-1 bg-[#3c4043] hover:bg-[#4b4f54] text-white py-2 rounded font-medium transition-colors">
// //                   Close
// //                 </button>
// //               </div>

// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start">
// //           <div className="bg-black/40 backdrop-blur-md p-2 rounded-lg flex items-center gap-2 shadow-sm pointer-events-auto">
// //               <img src="https://i.postimg.cc/4xS2G4WJ/image.png" alt="Cognicx" className="h-6 w-auto object-contain" />
// //               <span className="text-white/90 font-medium text-sm hidden sm:block tracking-wide">Cognicx Meet</span>
// //           </div>

// //           <div className="flex justify-center pointer-events-auto">
// //               <button 
// //                 onClick={checkSipConnection}
// //                 title="Check Connection Health"
// //                 className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium backdrop-blur-md shadow-sm transition-colors hover:bg-opacity-70 ${connectionState === 'Connected' ? 'bg-green-500/20 text-green-100 border border-green-500/30' : (connectionState === 'Error' ? 'bg-red-500/20 text-red-100 border border-red-500/30' : 'bg-gray-700/50 text-gray-200 border border-gray-600/30')}`}
// //               >
// //                   <div className={`w-2 h-2 rounded-full ${connectionState === 'Connected' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : (connectionState === 'Error' ? 'bg-red-500 animate-pulse' : 'bg-yellow-400')}`}></div>
// //                   <span>{connectionState === 'Connected' ? `${conferenceId}` : connectionState}</span>
// //                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
// //                     <path d="m6 9 6 6 6-6"/>
// //                   </svg>
// //               </button>
// //           </div>
// //           <div className="w-[120px] hidden sm:block"></div>
// //       </div>

// //       <div className="flex flex-1 w-full overflow-hidden relative">
// //           <div className={`flex-1 flex flex-col transition-all duration-300 ${isParticipantListOpen ? 'mr-0 md:mr-80 lg:mr-96' : ''}`}>
// //              <ParticipantGrid participants={participants} />
// //           </div>

// //           <ParticipantListSidebar 
// //              participants={participants}
// //              isOpen={isParticipantListOpen}
// //              onClose={() => setIsParticipantListOpen(false)}
// //           />
// //       </div>

// //       <ControlBar 
// //         isMuted={isMuted} 
// //         toggleMute={toggleMute} 
// //         onLeave={onLeave} 
// //         conferenceId={conferenceId}
// //         onToggleParticipantList={() => setIsParticipantListOpen(!isParticipantListOpen)}
// //         isParticipantListOpen={isParticipantListOpen}
// //       />
// //     </div>
// //   );
// // };

// // export default ConferenceScreen;
// import React, { useState, useEffect, useRef } from "react";
// import { ConnectionState, Participant } from "../types";
// import ControlBar from "./ControlBar";
// import ParticipantGrid from "./ParticipantGrid";
// import ParticipantListSidebar from "./ParticipantListSidebar";
// import { SignalIcon, SignalOffIcon } from "./Icons";

// // NEW: WebSocket libs
// import SockJS from "sockjs-client";
// import Stomp from "stompjs";

// interface ConferenceScreenProps {
//   conferenceId: string;
//   userName: string;
//   onLeave: () => void;
// }

// const ConferenceScreen: React.FC<ConferenceScreenProps> = ({
//   conferenceId,
//   userName,
//   onLeave,
// }) => {
//   const [isMuted, setIsMuted] = useState(false);
//   const [participants, setParticipants] = useState<Participant[]>([]);
//   const [connectionState, setConnectionState] =
//     useState<ConnectionState>("Initializing...");
//   const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
//   const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);

//   // Error and Status States
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [warningMsg, setWarningMsg] = useState<string | null>(null);
//   const [autoplayBlocked, setAutoplayBlocked] = useState(false);

//   // Diagnostics State
//   const [showStatusModal, setShowStatusModal] = useState(false);
//   const [diagnostics, setDiagnostics] = useState({
//     sipStatus: "Unknown",
//     transportStatus: "Unknown",
//     micStatus: "Unknown",
//   });

//   // Refs for WebRTC/SIP objects
//   const remoteAudioRef = useRef<HTMLAudioElement>(null);
//   const uaRef = useRef<any>(null);
//   const sessionRef = useRef<any>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const rafRef = useRef<number | null>(null);
//   const mediaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // Race Condition Management
//   const attemptRef = useRef(0);
//   const reconnectAttemptsRef = useRef(0);

//   // NEW: WebSocket client ref
//   const stompRef = useRef<any>(null);

//   // NEW: Track last speaking state to avoid too many re-renders
//   const lastSpeakingStateRef = useRef(false);

//   // --- PARTICIPANTS MANAGEMENT ---

//   // Ensure local user is always present and updated, but don't wipe remote participants
//   useEffect(() => {
//     setParticipants((prev) => {
//       const others = prev.filter((p) => !p.isLocal);
//       const local: Participant = {
//         id: "local-user",
//         name: userName,
//         isMuted: isMuted,
//         isSpeaking: false,
//         isLocal: true,
//       };
//       return [local, ...others];
//     });
//   }, [userName, isMuted]);

//   // When conference changes, clear remote participants (keep only local)
//   useEffect(() => {
//     setParticipants((prev) => prev.filter((p) => p.isLocal));
//   }, [conferenceId]);

//   // Global Audio Context Resume (Fix for "Voice not coming" in production)
//   useEffect(() => {
//     const resumeAudio = () => {
//       if (audioContextRef.current && audioContextRef.current.state === "suspended") {
//         audioContextRef.current
//           .resume()
//           .catch((e) => console.warn("Failed to auto-resume audio context:", e));
//       }
//     };
//     document.addEventListener("click", resumeAudio);
//     document.addEventListener("touchstart", resumeAudio);
//     return () => {
//       document.removeEventListener("click", resumeAudio);
//       document.removeEventListener("touchstart", resumeAudio);
//     };
//   }, []);

//   // Async cleanup to ensure UA stops completely
//   const cleanup = async () => {
//     if (rafRef.current) {
//       cancelAnimationFrame(rafRef.current);
//       rafRef.current = null;
//     }
//     if (mediaTimeoutRef.current) {
//       clearTimeout(mediaTimeoutRef.current);
//       mediaTimeoutRef.current = null;
//     }

//     if (audioContextRef.current && audioContextRef.current.state !== "closed") {
//       audioContextRef.current
//         .close()
//         .catch((e) => console.warn("Error closing audio context", e));
//     }

//     if (sessionRef.current) {
//       try {
//         if (
//           sessionRef.current.state === "Established" ||
//           sessionRef.current.state === "Establishing"
//         ) {
//           sessionRef.current.bye();
//         } else if (sessionRef.current.state === "Initial") {
//           sessionRef.current.cancel();
//         }
//       } catch (e) {
//         console.warn("Session cleanup error:", e);
//       }
//       sessionRef.current = null;
//     }

//     if (uaRef.current) {
//       try {
//         // Ensure we stop the UserAgent to close WebSocket connections
//         if (uaRef.current.status !== "Stopped") {
//           await uaRef.current.stop();
//           console.log("SIP UA Stopped");
//         }
//       } catch (e) {
//         console.warn("UA stop error:", e);
//       }
//       uaRef.current = null;
//     }
//   };

//   const ensureSIPLoaded = async (): Promise<boolean> => {
//     const checkGlobal = () => !!(window as any).SIP;
//     if (checkGlobal()) return true;

//     const waitForGlobal = async (duration: number) => {
//       const start = Date.now();
//       while (Date.now() - start < duration) {
//         if (checkGlobal()) return true;
//         await new Promise((r) => setTimeout(r, 100));
//       }
//       return false;
//     };

//     console.log("Checking for pre-loaded SIP.js...");
//     if (await waitForGlobal(2000)) return true;

//     console.warn("Initial load failed. Initiating fallback sequence...");

//     const umdSources = [
//       "https://cdnjs.cloudflare.com/ajax/libs/sip.js/0.21.2/sip.min.js",
//       "https://cdn.jsdelivr.net/npm/sip.js@0.21.2/dist/sip.min.js",
//       "https://unpkg.com/sip.js@0.21.2/dist/sip.min.js",
//     ];

//     const injectScript = (src: string) =>
//       new Promise<void>((resolve, reject) => {
//         if (document.querySelector(`script[src="${src}"]`)) {
//           resolve();
//           return;
//         }
//         const script = document.createElement("script");
//         script.src = src;
//         script.async = true;
//         script.onload = () => resolve();
//         script.onerror = (e) => reject(e);
//         document.head.appendChild(script);
//       });

//     for (const src of umdSources) {
//       try {
//         console.log(`Attempting UMD Fallback: ${src}`);
//         await injectScript(src);
//         if (await waitForGlobal(1500)) {
//           console.log(`Success: Loaded SIP.js via ${src}`);
//           return true;
//         }
//       } catch (e) {
//         console.warn(`Failed UMD Fallback: ${src}`);
//       }
//     }

//     try {
//       console.log("Attempting ESM Import Fallback (esm.sh)...");
//       // @ts-ignore
//        const module = await import(/* @vite-ignore */ "https://esm.sh/sip.js@0.21.2");
//       if (module && (module.UserAgent || module.default?.UserAgent)) {
//         (window as any).SIP = module.default || module;
//         console.log("Success: Loaded SIP.js via ESM");
//         return true;
//       }
//     } catch (e) {
//       console.warn("ESM Fallback failed:", e);
//     }

//     return checkGlobal();
//   };

//   const handleConnect = async () => {
//     const currentAttemptId = ++attemptRef.current;

//     await cleanup();

//     if (currentAttemptId !== attemptRef.current) return;

//     setErrorMsg(null);
//     setWarningMsg(null);
//     setConnectionState("Initializing...");

//     try {
//       // 1) SIP.js availability check
//       const sipLoaded = await ensureSIPLoaded();
//       if (currentAttemptId !== attemptRef.current) return;

//       if (!sipLoaded) {
//         setErrorMsg(
//           "SIP.js failed to load. Your network may be blocking libraries."
//         );
//         return;
//       }

//       const SIP = (window as any).SIP;

//       // 2) Secure Context & Mic support check
//       if (!window.isSecureContext) {
//         setErrorMsg(
//           "Insecure Context Detected. Please use 'localhost' or setup HTTPS."
//         );
//         return;
//       }

//       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//         setErrorMsg("Microphone access is not supported in this browser.");
//         return;
//       }

//       setConnectionState("Requesting Mic...");

//       // 3) Request mic
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         stream.getTracks().forEach((t) => t.stop());
//       } catch (err: any) {
//         if (currentAttemptId !== attemptRef.current) return;
//         setConnectionState("Error");
//         if (
//           err.name === "NotAllowedError" ||
//           err.name === "PermissionDeniedError"
//         ) {
//           setErrorMsg(
//             "Microphone permission denied. Please allow microphone access."
//           );
//         } else {
//           setErrorMsg(`Failed to access microphone: ${err.message}`);
//         }
//         return;
//       }

//       setConnectionState("Connecting to Server...");
//       if (currentAttemptId !== attemptRef.current) return;

//       // 4) SIP Config
//       const server = "wss://cognicx.callanywhere.co.in:8089/ws";
//       const domain = "cognicx.callanywhere.co.in";
//       const user = "webconf";
//       const pass = "webconf";

//       const uri = SIP.UserAgent.makeURI(`sip:${user}@${domain}`);
//       if (!uri) {
//         setErrorMsg("Invalid SIP configuration.");
//         return;
//       }

//       const ua = new SIP.UserAgent({
//         uri,
//         authorizationUsername: user,
//         authorizationPassword: pass,
//         transportOptions: {
//           server: server,
//           traceSip: true,
//           connectionTimeout: 10,
//           keepAliveInterval: 30,
//         },
//         sessionDescriptionHandlerFactoryOptions: {
//           constraints: {
//             audio: {
//               echoCancellation: true,
//               noiseSuppression: true,
//               autoGainControl: true,
//             },
//             video: false,
//           },
//         },
//         register: false,
//         userAgentString: "Cognicx Meet Client",
//       });

//       uaRef.current = ua;

//       ua.transport.stateChange.addListener((state: any) => {
//         console.log("Transport State:", state);
//         if (currentAttemptId !== attemptRef.current) return;

//         if (state === "Disconnected") {
//           if (connectionState !== "Terminated" && connectionState !== "Error") {
//             if (reconnectAttemptsRef.current < 3) {
//               setWarningMsg(
//                 `Connection lost. Reconnecting (Attempt ${
//                   reconnectAttemptsRef.current + 1
//                 }/3)...`
//               );
//               reconnectAttemptsRef.current += 1;
//               setTimeout(() => {
//                 if (
//                   uaRef.current &&
//                   uaRef.current.transport.state === "Disconnected"
//                 ) {
//                   uaRef.current.transport
//                     .connect()
//                     .catch((e: any) => console.warn("Reconnection failed", e));
//                 }
//               }, 2000);
//             } else {
//               setWarningMsg(null);
//               setConnectionState("Error");
//               setErrorMsg("Lost connection to the server. Please retry.");
//             }
//           }
//         } else if (state === "Connected") {
//           setWarningMsg(null);
//           reconnectAttemptsRef.current = 0;
//         }
//       });

//       try {
//         await ua.start();
//       } catch (err: any) {
//         if (currentAttemptId !== attemptRef.current) return;
//         console.error("UA Start Failed:", err);
//         setConnectionState("Error");
//         setErrorMsg(
//           "Could not connect to SIP server. Firewall or SSL/WSS issue detected."
//         );
//         return;
//       }

//       if (currentAttemptId !== attemptRef.current) {
//         ua.stop();
//         return;
//       }

//       setConnectionState("Calling...");

//       // 5) Create Invite
//       const targetURI = SIP.UserAgent.makeURI(`sip:webconf@${domain}`);
//       if (!targetURI) {
//         setErrorMsg("Invalid Target URI");
//         return;
//       }

//       const inviter = new SIP.Inviter(ua, targetURI, {
//         sessionDescriptionHandlerOptions: {
//           constraints: { audio: true, video: false },
//         },
//         extraHeaders: [
//           `X-Meeting-Id: ${conferenceId.trim()}`,
//           `X-Caller-Name: ${userName.trim()}`,
//         ],
//       });

//       sessionRef.current = inviter;
//       setupSessionListeners(inviter, currentAttemptId);

//       inviter
//         .invite()
//         .then(() => console.log("Invite sent successfully"))
//         .catch((e: any) => {
//           if (currentAttemptId !== attemptRef.current) return;
//           console.error("Invite failed", e);
//           setConnectionState("Error");
//           setErrorMsg(
//             "Failed to connect to conference: " + (e.message || "Unknown error")
//           );
//         });
//     } catch (err: any) {
//       if (currentAttemptId !== attemptRef.current) return;
//       console.error("WebRTC / SIP Error:", err);
//       setConnectionState("Error");
//       setErrorMsg(err.message || "Connection failed unexpectedly");
//     }
//   };

//   const checkSipConnection = () => {
//     let sip = "Disconnected";
//     let transport = "Unknown";
//     let mic = "Unknown";
//     const SIP = (window as any).SIP;

//     if (uaRef.current && SIP) {
//       sip = uaRef.current.isConnected() ? "Connected" : "Disconnected";
//     } else {
//       sip = "Not Initialized";
//     }

//     if (sessionRef.current && sessionRef.current.sessionDescriptionHandler) {
//       const pc = sessionRef.current.sessionDescriptionHandler.peerConnection;
//       if (pc) {
//         transport = pc.connectionState;
//       } else {
//         transport = "No Peer Connection";
//       }
//     } else {
//       transport = "No Active Session";
//     }

//     if (!window.isSecureContext) {
//       mic = "Insecure Context (Failed)";
//     } else if (connectionState === "Error" && errorMsg?.includes("Microphone")) {
//       mic = "Blocked/Missing";
//     } else if (
//       audioContextRef.current &&
//       audioContextRef.current.state === "running"
//     ) {
//       mic = "Active";
//     } else {
//       mic = "Granted (Idle)";
//     }

//     setDiagnostics({
//       sipStatus: sip,
//       transportStatus: transport,
//       micStatus: mic,
//     });
//     setShowStatusModal(true);
//   };

//   const handleRetry = () => {
//     reconnectAttemptsRef.current = 0;
//     setShowStatusModal(false);
//     handleConnect();
//   };

//   // SIP connect on mount / dependency change
//   useEffect(() => {
//     handleConnect();

//     return () => {
//       attemptRef.current += 1;
//       cleanup();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [conferenceId, userName]);

//   const setupSessionListeners = (inviter: any, myAttemptId: number) => {
//     inviter.stateChange.addListener((state: any) => {
//       if (myAttemptId !== attemptRef.current) return;
//       console.log("SIP Session State:", state);

//       switch (state) {
//         case "Initial":
//           setConnectionState("Initializing...");
//           break;
//         case "Establishing":
//           setConnectionState("Calling...");
//           break;
//         case "Established":
//           setConnectionState("Connected");
//           handleRemoteStream(inviter);
//           if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
//           mediaTimeoutRef.current = setTimeout(() => {
//             if (!remoteAudioRef.current?.srcObject) {
//               setWarningMsg("Connected, but no audio received yet.");
//             }
//           }, 8000);
//           break;
//         case "Terminated":
//           setConnectionState("Terminated");
//           if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
//           setTimeout(() => {
//             if (myAttemptId === attemptRef.current) onLeave();
//           }, 1000);
//           break;
//         default:
//           break;
//       }
//     });

//     inviter.delegate = {
//       onProgress: (response: any) => {
//         if (myAttemptId !== attemptRef.current) return;
//         console.log("Call Progress (Early Media)");
//         checkAndAttachMedia(inviter);
//       },
//       onAccept: (response: any) => {
//         if (myAttemptId !== attemptRef.current) return;
//         console.log("Call Accepted");
//         checkAndAttachMedia(inviter);
//       },
//     };
//   };

//   const checkAndAttachMedia = (inviter: any) => {
//     if (!inviter.sessionDescriptionHandler) return;

//     const pc = inviter.sessionDescriptionHandler.peerConnection;
//     if (!pc) return;

//     if (!(pc as any).hasAttachedConnectionState) {
//       pc.addEventListener("connectionstatechange", () => {
//         console.log("ICE Connection State:", pc.connectionState);
//         if (pc.connectionState === "failed") {
//           setErrorMsg("Network firewall blocking connection (ICE Failed).");
//         } else if (pc.connectionState === "disconnected") {
//           setWarningMsg("Connection interrupted. Reconnecting...");
//         } else if (pc.connectionState === "connected") {
//           setWarningMsg(null);
//         }
//       });
//       (pc as any).hasAttachedConnectionState = true;
//     }

//     const receivers = pc.getReceivers();
//     const audioReceiver = receivers.find(
//       (r: any) => r.track && r.track.kind === "audio"
//     );
//     if (audioReceiver && audioReceiver.track) {
//       attachStream(new MediaStream([audioReceiver.track]));
//     }

//     if (!(pc as any).hasAttachedOntrack) {
//       pc.ontrack = (event: any) => {
//         if (event.streams && event.streams[0]) {
//           attachStream(event.streams[0]);
//         } else if (event.track) {
//           attachStream(new MediaStream([event.track]));
//         }
//       };
//       (pc as any).hasAttachedOntrack = true;
//     }
//   };

//   const handleRemoteStream = (inviter: any) => {
//     checkAndAttachMedia(inviter);
//   };

//   const attachStream = (stream: MediaStream) => {
//     if (mediaTimeoutRef.current) {
//       clearTimeout(mediaTimeoutRef.current);
//       mediaTimeoutRef.current = null;
//     }
//     setWarningMsg(null);

//     if (remoteAudioRef.current) {
//       const newTrackId = stream.getAudioTracks()[0]?.id;
//       const currentSrc = remoteAudioRef.current.srcObject as MediaStream;
//       const currentTrackId = currentSrc?.getAudioTracks()[0]?.id;

//       if (!currentSrc || currentTrackId !== newTrackId) {
//         console.log("Attaching new audio stream ID:", newTrackId);
//         remoteAudioRef.current.srcObject = stream;
//         remoteAudioRef.current.muted = false;
//         remoteAudioRef.current.volume = 1.0;

//         const playPromise = remoteAudioRef.current.play();
//         if (playPromise !== undefined) {
//           playPromise
//             .then(() => {
//               setAutoplayBlocked(false);
//               setWarningMsg(null);
//               console.log("Audio playback started successfully");
//             })
//             .catch((e) => {
//               console.error("Audio playback error:", e);
//               if (e.name === "NotAllowedError") {
//                 setAutoplayBlocked(true);
//                 setWarningMsg(
//                   "Browser blocked audio. Click 'Start Audio' to listen."
//                 );
//               } else {
//                 setWarningMsg("Playback error: " + e.message);
//               }
//             });
//         }

//         setupAudioAnalysis(stream);
//       }
//     }
//   };

//   const setupAudioAnalysis = (stream: MediaStream) => {
//     try {
//       const AudioContextClass =
//         window.AudioContext || (window as any).webkitAudioContext;

//       if (!audioContextRef.current || audioContextRef.current.state === "closed") {
//         audioContextRef.current = new AudioContextClass();
//       }

//       const ctx = audioContextRef.current;

//       if (ctx.state === "suspended") {
//         ctx.resume().catch((e) => console.warn("Failed to resume audio context", e));
//       }

//       if (analyserRef.current) return;

//       const src = ctx.createMediaStreamSource(stream);
//       const analyser = ctx.createAnalyser();
//       analyser.fftSize = 256;
//       analyser.smoothingTimeConstant = 0.5;
//       src.connect(analyser);
//       analyserRef.current = analyser;

//       const data = new Uint8Array(analyser.frequencyBinCount);

//       const detect = () => {
//         if (!analyserRef.current) return;
//         analyserRef.current.getByteFrequencyData(data);

//         let sum = 0;
//         for (let i = 0; i < data.length; i++) {
//           sum += data[i];
//         }
//         const avg = sum / data.length;
//         const speaking = avg > 10;

//         // Avoid state spam
//         if (speaking !== lastSpeakingStateRef.current) {
//           lastSpeakingStateRef.current = speaking;
//           setIsRemoteSpeaking(speaking);

//           // Mark all remote participants as speaking / not speaking
//           setParticipants((prev) =>
//             prev.map((p) =>
//               !p.isLocal ? { ...p, isSpeaking: speaking } : p
//             )
//           );
//         }

//         rafRef.current = requestAnimationFrame(detect);
//       };
//       detect();
//     } catch (e) {
//       console.error("Audio Analysis Setup Error", e);
//     }
//   };

//   const toggleMute = () => {
//     const session = sessionRef.current;
//     if (!session) return;

//     let pc = null;
//     if (session.sessionDescriptionHandler) {
//       pc = session.sessionDescriptionHandler.peerConnection;
//     }

//     if (!pc) return;

//     const senders = pc.getSenders();
//     const audioSender = senders.find(
//       (s: any) => s.track && s.track.kind === "audio"
//     );

//     if (audioSender && audioSender.track) {
//       const newEnabled = !audioSender.track.enabled;
//       audioSender.track.enabled = newEnabled;
//       setIsMuted(!newEnabled);
//     } else {
//       setWarningMsg("Microphone track not found.");
//       setTimeout(() => setWarningMsg(null), 3000);
//     }
//   };

//   const handleEnableAudio = () => {
//     if (remoteAudioRef.current) {
//       remoteAudioRef.current.muted = false;
//       remoteAudioRef.current.volume = 1.0;
//       remoteAudioRef.current
//         .play()
//         .then(() => {
//           setAutoplayBlocked(false);
//           setWarningMsg(null);
//           if (audioContextRef.current?.state === "suspended") {
//             audioContextRef.current.resume();
//           }
//         })
//         .catch((e) => console.error("Still failed to play:", e));
//     }
//   };

//   // --- NEW: HANDLE AMI CONFERENCE EVENTS FROM WEBSOCKET ---

//   const handleConferenceEvent = (evt: any) => {
//     const { conferenceId: evtConfId, channel, callerIdName, status, muted } = evt;

//     if (!evtConfId || evtConfId.toString() !== conferenceId.toString()) {
//       return;
//     }

//     setParticipants((prev) => {
//       let list = [...prev];

//       // JOIN
//       if (status === "JOINED") {
//         if (!list.some((p) => p.id === channel)) {
//           list.push({
//             id: channel,
//             name: callerIdName || "Guest",
//             isMuted: !!muted,
//             isSpeaking: false,
//             isLocal: false,
//           });
//         }
//         return list;
//       }

//       // LEAVE
//       if (status === "LEFT") {
//         return list.filter((p) => p.id !== channel);
//       }

//       // MUTE / UNMUTE (if your backend sends these)
//       if (status === "MUTED" || status === "UNMUTED") {
//         return list.map((p) =>
//           p.id === channel ? { ...p, isMuted: !!muted } : p
//         );
//       }

//       return list;
//     });
//   };

//   // --- NEW: AMI WebSocket subscription ---

//   useEffect(() => {
//     console.log("Connecting AMI WebSocket for conference:", conferenceId);

//     const socket = new SockJS("https://localhost:9070/ws-ami");
//     const stomp = Stomp.over(socket);
//     stomp.debug = () => {}; // mute logs
//     stompRef.current = stomp;

//     stomp.connect(
//       {},
//       () => {
//         console.log("AMI WebSocket connected");

//         // Subscribing to generic conference topic & filter by conferenceId
//         stomp.subscribe("/topic/conference", (msg: any) => {
//           try {
//             const evt = JSON.parse(msg.body);
//             console.log("EVENT →", evt);
//             handleConferenceEvent(evt);
//           } catch (e) {
//             console.error("Error parsing conference event:", e);
//           }
//         });
//       },
//       (error) => {
//         console.error("AMI WebSocket connection error:", error);
//       }
//     );

//     return () => {
//       if (stompRef.current && stompRef.current.connected) {
//         stompRef.current.disconnect(() => {
//           console.log("AMI WebSocket disconnected");
//         });
//       }
//       stompRef.current = null;
//     };
//   }, [conferenceId]);

//   return (
//     <div className="w-full h-screen bg-[#202124] flex flex-col relative overflow-hidden">
//       {/* Audio Element: Opacity 0 instead of display:none to ensure browsers prioritize playback */}
//       <audio
//         ref={remoteAudioRef}
//         autoPlay
//         playsInline
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           opacity: 0,
//           pointerEvents: "none",
//         }}
//       />

//       {errorMsg && (
//         <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4">
//           <div className="bg-red-600/95 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-red-400 max-w-2xl w-full">
//             <div className="flex-1">
//               <p className="font-bold uppercase text-xs tracking-wider opacity-90 mb-1">
//                 Connection Error
//               </p>
//               <p className="text-sm md:text-base font-medium">{errorMsg}</p>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={handleRetry}
//                 className="p-2 hover:bg-white/20 rounded-full transition font-bold px-4 bg-white/10 border border-white/20"
//               >
//                 RETRY
//               </button>
//               <button
//                 onClick={() => setErrorMsg(null)}
//                 className="p-2 hover:bg-white/10 rounded-full transition font-bold px-4 text-sm opacity-80"
//               >
//                 DISMISS
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {warningMsg && !autoplayBlocked && (
//         <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4">
//           <div className="bg-yellow-600/95 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-yellow-400 max-w-2xl w-full">
//             <div className="flex-1">
//               <p className="font-bold uppercase text-xs tracking-wider opacity-90 mb-1">
//                 Notice
//               </p>
//               <p className="text-sm md:text-base font-medium">{warningMsg}</p>
//             </div>
//             <button
//               onClick={() => setWarningMsg(null)}
//               className="p-2 hover:bg-white/10 rounded-full transition font-bold px-4 bg-white/10"
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       )}

//       {autoplayBlocked && (
//         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
//           <div className="text-center p-8 bg-[#3c4043] rounded-2xl shadow-2xl border border-gray-600 max-w-md">
//             <h3 className="text-2xl font-bold mb-4 text-[#8ab4f8]">
//               Enable Audio
//             </h3>
//             <p className="mb-8 text-gray-300 text-lg">
//               Your browser has blocked audio autoplay. Click the button below to
//               join the conversation.
//             </p>
//             <button
//               onClick={handleEnableAudio}
//               className="px-8 py-4 bg-[#8ab4f8] text-[#202124] font-bold text-lg rounded-full hover:bg-[#a6c8ff] transition transform hover:scale-105 shadow-lg"
//             >
//               Start Audio
//             </button>
//           </div>
//         </div>
//       )}

//       {showStatusModal && (
//         <div
//           className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//           onClick={() => setShowStatusModal(false)}
//         >
//           <div
//             className="bg-[#303134] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="p-4 border-b border-gray-700 flex justify-between items-center">
//               <h3 className="text-lg font-medium text-white">
//                 Connection Health
//               </h3>
//               <button
//                 onClick={() => setShowStatusModal(false)}
//                 className="text-gray-400 hover:text-white"
//               >
//                 ✕
//               </button>
//             </div>
//             <div className="p-6 space-y-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div
//                     className={`p-2 rounded-full ${
//                       diagnostics.sipStatus === "Connected"
//                         ? "bg-green-500/20 text-green-400"
//                         : "bg-red-500/20 text-red-400"
//                     }`}
//                   >
//                     {diagnostics.sipStatus === "Connected" ? (
//                       <SignalIcon className="w-5 h-5" />
//                     ) : (
//                       <SignalOffIcon className="w-5 h-5" />
//                     )}
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-300 font-medium">
//                       SIP Server
//                     </p>
//                     <p className="text-xs text-gray-500">
//                       {diagnostics.sipStatus}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div
//                     className={`p-2 rounded-full ${
//                       diagnostics.transportStatus === "connected"
//                         ? "bg-green-500/20 text-green-400"
//                         : diagnostics.transportStatus === "failed"
//                         ? "bg-red-500/20 text-red-400"
//                         : "bg-yellow-500/20 text-yellow-400"
//                     }`}
//                   >
//                     <SignalIcon className="w-5 h-5" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-300 font-medium">
//                       Media Transport (ICE)
//                     </p>
//                     <p className="text-xs text-gray-500 capitalize">
//                       {diagnostics.transportStatus}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div
//                     className={`p-2 rounded-full ${
//                       diagnostics.micStatus === "Active"
//                         ? "bg-green-500/20 text-green-400"
//                         : diagnostics.micStatus === "Blocked/Missing" ||
//                           diagnostics.micStatus.includes("Insecure")
//                         ? "bg-red-500/20 text-red-400"
//                         : "bg-yellow-500/20 text-yellow-400"
//                     }`}
//                   >
//                     <SignalIcon className="w-5 h-5" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-300 font-medium">
//                       Microphone
//                     </p>
//                     <p className="text-xs text-gray-500">
//                       {diagnostics.micStatus}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="pt-2 flex gap-3">
//                 <button
//                   onClick={handleRetry}
//                   className="flex-1 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] py-2 rounded font-medium transition-colors"
//                 >
//                   {diagnostics.sipStatus !== "Connected"
//                     ? "Retry Connection"
//                     : "Reconnect"}
//                 </button>
//                 <button
//                   onClick={() => setShowStatusModal(false)}
//                   className="flex-1 bg-[#3c4043] hover:bg-[#4b4f54] text-white py-2 rounded font-medium transition-colors"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Top Bar */}
//       <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start">
//         <div className="bg-black/40 backdrop-blur-md p-2 rounded-lg flex items-center gap-2 shadow-sm pointer-events-auto">
//           <img
//             src="https://i.postimg.cc/4xS2G4WJ/image.png"
//             alt="Cognicx"
//             className="h-6 w-auto object-contain"
//           />
//           <span className="text-white/90 font-medium text-sm hidden sm:block tracking-wide">
//             Cognicx Meet
//           </span>
//         </div>

//         <div className="flex flex-col items-center gap-1 pointer-events-auto">
//           <button
//             onClick={checkSipConnection}
//             title="Check Connection Health"
//             className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium backdrop-blur-md shadow-sm transition-colors hover:bg-opacity-70 ${
//               connectionState === "Connected"
//                 ? "bg-green-500/20 text-green-100 border border-green-500/30"
//                 : connectionState === "Error"
//                 ? "bg-red-500/20 text-red-100 border border-red-500/30"
//                 : "bg-gray-700/50 text-gray-200 border border-gray-600/30"
//             }`}
//           >
//             <div
//               className={`w-2 h-2 rounded-full ${
//                 connectionState === "Connected"
//                   ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"
//                   : connectionState === "Error"
//                   ? "bg-red-500 animate-pulse"
//                   : "bg-yellow-400"
//               }`}
//             ></div>
//             <span>
//               {connectionState === "Connected" ? `${conferenceId}` : connectionState}
//             </span>
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="14"
//               height="14"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               className="opacity-70"
//             >
//               <path d="m6 9 6 6 6-6" />
//             </svg>
//           </button>

//           {/* Participant count badge */}
//           <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 text-xs text-gray-200">
//             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
//             <span>{participants.length} in meeting</span>
//           </div>
//         </div>

//         <div className="w-[120px] hidden sm:block"></div>
//       </div>

//       {/* Main Content */}
//       <div className="flex flex-1 w-full overflow-hidden relative">
//         <div
//           className={`flex-1 flex flex-col transition-all duration-300 ${
//             isParticipantListOpen ? "mr-0 md:mr-80 lg:mr-96" : ""
//           }`}
//         >
//           <ParticipantGrid participants={participants} />
//         </div>

//         <ParticipantListSidebar
//           participants={participants}
//           isOpen={isParticipantListOpen}
//           onClose={() => setIsParticipantListOpen(false)}
//         />
//       </div>

//       <ControlBar
//         isMuted={isMuted}
//         toggleMute={toggleMute}
//         onLeave={onLeave}
//         conferenceId={conferenceId}
//         onToggleParticipantList={() =>
//           setIsParticipantListOpen(!isParticipantListOpen)
//         }
//         isParticipantListOpen={isParticipantListOpen}
//       />
//     </div>
//   );
// };

// export default ConferenceScreen;

import React, { useState, useEffect, useRef } from "react";
import { ConnectionState, Participant } from "../types";
import ControlBar from "./ControlBar";
import ParticipantGrid from "./ParticipantGrid";
import ParticipantListSidebar from "./ParticipantListSidebar";
import { SignalIcon, SignalOffIcon } from "./Icons";

import SockJS from "sockjs-client";
import Stomp from "stompjs";
import {
  UserAgent,
  Inviter,
  SessionState,
  UserAgentOptions,
} from "sip.js";

interface ConferenceScreenProps {
  conferenceId: string;
  userName: string;
  onLeave: () => void;
}

const SIP_SERVER = "wss://cognicx.callanywhere.co.in:8089/ws";
const SIP_DOMAIN = "cognicx.callanywhere.co.in";
const SIP_USER = "webconf";
const SIP_PASS = "webconf";

const ConferenceScreen: React.FC<ConferenceScreenProps> = ({
  conferenceId,
  userName,
  onLeave,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("Initializing");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    sipStatus: "Unknown",
    transportStatus: "Unknown",
    micStatus: "Unknown",
  });

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const uaRef = useRef<UserAgent | null>(null);
  const sessionRef = useRef<Inviter | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const attemptRef = useRef(0);

  // ensure local participant
  useEffect(() => {
    setParticipants((prev) => {
      const others = prev.filter((p) => !p.isLocal);
      return [
        {
          id: "local-user",
          name: userName || "You",
          isMuted,
          isSpeaking: false,
          isLocal: true,
        },
        ...others,
      ];
    });
  }, [userName, isMuted]);

  // Global audioContext resume on any click/touch
  useEffect(() => {
    const resumeAudio = () => {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener("click", resumeAudio);
    document.addEventListener("touchstart", resumeAudio);
    return () => {
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("touchstart", resumeAudio);
    };
  }, []);

  // ---- WebSocket: conference events ----
  useEffect(() => {
    const socket = new SockJS("https://localhost:9070/ws-ami");
    const stomp = Stomp.over(socket);
    stomp.debug = () => {};

    stomp.connect(
      {},
      () => {
        stomp.subscribe("/topic/conference", (msg) => {
          try {
            const evt = JSON.parse(msg.body);
            if (evt.conferenceId?.toString() !== conferenceId.toString()) return;
            handleConferenceEvent(evt);
          } catch (e) {
            console.error("WS parse error", e);
          }
        });
      },
      (err) => console.error("WS error", err)
    );

    return () => {
  if (stomp && stomp.connected) {
    try {
      stomp.disconnect(() => {
        console.log("STOMP disconnected cleanly.");
      });
    } catch (e) {
      console.warn("STOMP disconnect error:", e);
    }
  }
};

  }, [conferenceId]);

  const handleConferenceEvent = (evt: any) => {
    const { channel, callerIdName, status, muted } = evt;

    setParticipants((prev) => {
      let list = [...prev];

      if (status === "JOINED") {
        if (!list.some((p) => p.id === channel)) {
          list.push({
            id: channel,
            name: callerIdName || "Guest",
            isMuted: !!muted,
            isSpeaking: false,
            isLocal: false,
          });
        }
        return list;
      }

      if (status === "LEFT") {
        return list.filter((p) => p.id !== channel);
      }

      if (status === "MUTED" || status === "UNMUTED") {
        return list.map((p) =>
          p.id === channel ? { ...p, isMuted: !!muted } : p
        );
      }

      return list;
    });
  };

  // ---- SIP setup / teardown ----

  const cleanupSip = async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        await audioContextRef.current.close();
      } catch {
        //
      }
      audioContextRef.current = null;
    }

    if (sessionRef.current) {
      try {
        await sessionRef.current.dispose();
      } catch {
        //
      }
      sessionRef.current = null;
    }

    if (uaRef.current) {
      try {
        await uaRef.current.stop();
      } catch {
        //
      }
      uaRef.current = null;
    }
  };

  const handleConnect = async () => {
    const attemptId = ++attemptRef.current;

    setErrorMsg(null);
    setWarningMsg(null);
    setConnectionState("Initializing");

    await cleanupSip();
    if (attemptId !== attemptRef.current) return;

    // mic check
    try {
      setConnectionState("Requesting Mic");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err: any) {
      if (attemptId !== attemptRef.current) return;
      setConnectionState("Error");
      setErrorMsg(
        err?.name === "NotAllowedError"
          ? "Microphone permission denied."
          : "Failed to access microphone."
      );
      return;
    }

    // SIP UA
    try {
      setConnectionState("Connecting");

      const uri = UserAgent.makeURI(`sip:${SIP_USER}@${SIP_DOMAIN}`);
      if (!uri) {
        setErrorMsg("Invalid SIP URI");
        setConnectionState("Error");
        return;
      }

      const options: UserAgentOptions = {
        uri,
        authorizationUsername: SIP_USER,
        authorizationPassword: SIP_PASS,
        transportOptions: {
          server: SIP_SERVER,
        },
        sessionDescriptionHandlerFactoryOptions: {
          constraints: {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          },
        },
        delegate: {
          onConnect: () => console.log("SIP transport connected"),
          onDisconnect: () => {
            setWarningMsg("Disconnected from SIP server.");
          },
        },
      };

      const ua = new UserAgent(options);
      uaRef.current = ua;
      await ua.start();

      if (attemptId !== attemptRef.current) {
        await ua.stop();
        return;
      }

      setConnectionState("Calling");

      const targetUri = UserAgent.makeURI(`sip:webconf@${SIP_DOMAIN}`);
      if (!targetUri) {
        setErrorMsg("Invalid target URI");
        setConnectionState("Error");
        return;
      }

      const inviter = new Inviter(ua, targetUri, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
        extraHeaders: [
          `X-Meeting-Id: ${conferenceId.trim()}`,
          `X-Caller-Name: ${userName.trim()}`,
        ],
      });

      sessionRef.current = inviter;

      inviter.stateChange.addListener((state) => {
        if (attemptId !== attemptRef.current) return;

        switch (state) {
          case SessionState.Initial:
            setConnectionState("Initializing");
            break;
          case SessionState.Establishing:
            setConnectionState("Calling");
            break;
          case SessionState.Established:
            setConnectionState("Connected");
            attachRemoteMedia(inviter);
            break;
          case SessionState.Terminated:
            setConnectionState("Terminated");
            setTimeout(() => onLeave(), 800);
            break;
        }
      });

      inviter
        .invite()
        .then(() => console.log("INVITE sent"))
        .catch((e) => {
          if (attemptId !== attemptRef.current) return;
          console.error("Invite error", e);
          setErrorMsg("Failed to join conference.");
          setConnectionState("Error");
        });
    } catch (err: any) {
      if (attemptId !== attemptRef.current) return;
      console.error("SIP error", err);
      setErrorMsg("Could not connect to SIP server.");
      setConnectionState("Error");
    }
  };

  const attachRemoteMedia = (inviter: Inviter) => {
    const sdh: any = inviter.sessionDescriptionHandler;
    if (!sdh || !sdh.peerConnection) return;

    const pc: RTCPeerConnection = sdh.peerConnection;

    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) attachStream(stream);
    };

    const receivers = pc.getReceivers();
    const audioReceiver = receivers.find(
      (r) => r.track && r.track.kind === "audio"
    );
    if (audioReceiver?.track) {
      attachStream(new MediaStream([audioReceiver.track]));
    }
  };

  const attachStream = (stream: MediaStream) => {
    if (!remoteAudioRef.current) return;

    remoteAudioRef.current.srcObject = stream;
    remoteAudioRef.current.muted = false;
    remoteAudioRef.current.volume = 1.0;

    const playPromise = remoteAudioRef.current.play();
    if (playPromise) {
      playPromise
        .then(() => {
          setAutoplayBlocked(false);
          setWarningMsg(null);
        })
        .catch((e) => {
          if (e.name === "NotAllowedError") {
            setAutoplayBlocked(true);
            setWarningMsg("Browser blocked audio autoplay.");
          } else {
            setWarningMsg("Playback error.");
          }
        });
    }

    setupAudioAnalysis(stream);
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const AC =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AC();
      }
      const ctx = audioContextRef.current;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const speaking = avg > 10;

        setParticipants((prev) =>
          prev.map((p) =>
            p.isLocal ? p : { ...p, isSpeaking: speaking }
          )
        );

        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.error("Audio analysis error", e);
    }
  };

  // auto connect on mount / conference change
  useEffect(() => {
    handleConnect();
    return () => {
      attemptRef.current++;
      void cleanupSip();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, userName]);

  const toggleMute = () => {
    const inviter = sessionRef.current;
    if (!inviter) {
      setIsMuted((m) => !m);
      return;
    }

    const sdh: any = inviter.sessionDescriptionHandler;
    if (!sdh || !sdh.peerConnection) {
      setIsMuted((m) => !m);
      return;
    }

    const pc: RTCPeerConnection = sdh.peerConnection;
    const sender = pc
      .getSenders()
      .find((s) => s.track && s.track.kind === "audio");
    if (sender?.track) {
      sender.track.enabled = !sender.track.enabled;
      setIsMuted(!sender.track.enabled);
    } else {
      setWarningMsg("Mic track not found.");
    }
  };

  const handleEnableAudio = () => {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current
      .play()
      .then(() => {
        setAutoplayBlocked(false);
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume();
        }
      })
      .catch((e) => console.error("Play failed", e));
  };

  const checkSipConnection = () => {
    let sip = "Not Initialized";
    let transport = "No Active Session";
    let mic = "Unknown";

    if (uaRef.current) {
      sip = uaRef.current.isConnected() ? "Connected" : "Disconnected";
    }

    const inviter = sessionRef.current as any;
    if (inviter?.sessionDescriptionHandler?.peerConnection) {
      const pc: RTCPeerConnection =
        inviter.sessionDescriptionHandler.peerConnection;
      transport = pc.connectionState || "unknown";
    }

    if (!window.isSecureContext) {
      mic = "Insecure Context";
    } else if (!navigator.mediaDevices?.getUserMedia) {
      mic = "Not Supported";
    } else if (audioContextRef.current?.state === "running") {
      mic = "Active";
    } else {
      mic = "Granted/Idle";
    }

    setDiagnostics({
      sipStatus: sip,
      transportStatus: transport,
      micStatus: mic,
    });
    setShowStatusModal(true);
  };

  // ---- UI ----
  return (
    <div className="w-full h-screen bg-[#202124] flex flex-col relative overflow-hidden">
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {errorMsg && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4">
          <div className="bg-red-600/95 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-red-400 max-w-2xl w-full">
            <div className="flex-1">
              <p className="font-bold uppercase text-xs tracking-wider opacity-90 mb-1">
                Connection Error
              </p>
              <p className="text-sm md:text-base font-medium">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConnect}
                className="p-2 hover:bg-white/20 rounded-full transition font-bold px-4 bg-white/10 border border-white/20"
              >
                RETRY
              </button>
              <button
                onClick={() => setErrorMsg(null)}
                className="p-2 hover:bg-white/10 rounded-full transition font-bold px-4 text-sm opacity-80"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {warningMsg && !autoplayBlocked && (
        <div className="absolute top-20 left-0 right-0 z-40 flex justify-center px-4">
          <div className="bg-yellow-600/95 text-white px-6 py-3 rounded-lg shadow-lg border border-yellow-400 max-w-xl w-full text-sm">
            {warningMsg}
          </div>
        </div>
      )}

      {autoplayBlocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="text-center p-8 bg-[#3c4043] rounded-2xl shadow-2xl border border-gray-600 max-w-md">
            <h3 className="text-2xl font-bold mb-4 text-[#8ab4f8]">
              Enable Audio
            </h3>
            <p className="mb-8 text-gray-300 text-lg">
              Your browser blocked autoplay. Click the button below to start
              audio.
            </p>
            <button
              onClick={handleEnableAudio}
              className="px-8 py-4 bg-[#8ab4f8] text-[#202124] font-bold text-lg rounded-full hover:bg-[#a6c8ff] transition transform hover:scale-105 shadow-lg"
            >
              Start Audio
            </button>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-[#303134] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                Connection Health
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    diagnostics.sipStatus === "Connected"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {diagnostics.sipStatus === "Connected" ? (
                    <SignalIcon className="w-5 h-5" />
                  ) : (
                    <SignalOffIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-medium">
                    SIP Server
                  </p>
                  <p className="text-xs text-gray-500">
                    {diagnostics.sipStatus}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    diagnostics.transportStatus === "connected"
                      ? "bg-green-500/20 text-green-400"
                      : diagnostics.transportStatus === "failed"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  <SignalIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-medium">
                    Media Transport (ICE)
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {diagnostics.transportStatus}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    diagnostics.micStatus === "Active"
                      ? "bg-green-500/20 text-green-400"
                      : diagnostics.micStatus.includes("Insecure") ||
                        diagnostics.micStatus === "Not Supported"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  <SignalIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-medium">
                    Microphone
                  </p>
                  <p className="text-xs text-gray-500">
                    {diagnostics.micStatus}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleConnect}
                  className="flex-1 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] py-2 rounded font-medium transition-colors"
                >
                  Reconnect
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 bg-[#3c4043] hover:bg-[#4b4f54] text-white py-2 rounded font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start">
        <div className="bg-black/40 backdrop-blur-md p-2 rounded-lg flex items-center gap-2 shadow-sm pointer-events-auto">
          <img
            src="https://i.postimg.cc/4xS2G4WJ/image.png"
            alt="Cognicx"
            className="h-6 w-auto object-contain"
          />
          <span className="text-white/90 font-medium text-sm hidden sm:block tracking-wide">
            Cognicx Meet
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <button
            onClick={checkSipConnection}
            title="Check Connection Health"
            className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium backdrop-blur-md shadow-sm transition-colors hover:bg-opacity-70 ${
              connectionState === "Connected"
                ? "bg-green-500/20 text-green-100 border border-green-500/30"
                : connectionState === "Error"
                ? "bg-red-500/20 text-red-100 border border-red-500/30"
                : "bg-gray-700/50 text-gray-200 border border-gray-600/30"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                connectionState === "Connected"
                  ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                  : connectionState === "Error"
                  ? "bg-red-500 animate-pulse"
                  : "bg-yellow-400"
              }`}
            />
            <span>
              {connectionState === "Connected"
                ? conferenceId
                : connectionState}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 text-xs text-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{participants.length} in meeting</span>
          </div>
        </div>

        <div className="w-[120px] hidden sm:block" />
      </div>

      {/* Main content */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isParticipantListOpen ? "mr-0 md:mr-80 lg:mr-96" : ""
          }`}
        >
          <ParticipantGrid participants={participants} />
        </div>

        <ParticipantListSidebar
          participants={participants}
          isOpen={isParticipantListOpen}
          onClose={() => setIsParticipantListOpen(false)}
        />
      </div>

      <ControlBar
        isMuted={isMuted}
        toggleMute={toggleMute}
        onLeave={onLeave}
        conferenceId={conferenceId}
        onToggleParticipantList={() =>
          setIsParticipantListOpen(!isParticipantListOpen)
        }
        isParticipantListOpen={isParticipantListOpen}
      />
    </div>
  );
};

export default ConferenceScreen;
