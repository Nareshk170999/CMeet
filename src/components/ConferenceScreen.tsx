import React, { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import Stomp, { type Client, type Message, type Subscription } from "stompjs";
import { Inviter, UserAgent } from "sip.js";
import { ConnectionState, Participant } from "../types";
import ControlBar from "./ControlBar";
import ParticipantGrid from "./ParticipantGrid";
import ParticipantListSidebar from "./ParticipantListSidebar";
import { CopyIcon, ClockIcon, LinkIcon, SignalIcon, SignalOffIcon } from "./Icons";

interface ConferenceScreenProps {
  conferenceId: string;
  userName: string;
  onLeave: () => void;
}

const LOGO_SRC = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='%233c4043'/%3E%3Cpath d='M24 34c0-4.418 3.582-8 8-8h14l8 8h14c4.418 0 8 3.582 8 8v20c0 4.418-3.582 8-8 8H32c-4.418 0-8-3.582-8-8z' fill='%238ab4f8'/%3E%3Ccircle cx='34' cy='48' r='6' fill='%23fff'/%3E%3Ccircle cx='54' cy='48' r='6' fill='%23fff'/%3E%3C/svg%3E`;

const ConferenceScreen: React.FC<ConferenceScreenProps> = ({
  conferenceId,
  userName,
  onLeave,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("Initializing...");
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    sipStatus: "Unknown",
    transportStatus: "Unknown",
    micStatus: "Unknown",
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteValidity, setInviteValidity] = useState(30);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const uaRef = useRef<UserAgent | null>(null);
  const sessionRef = useRef<Inviter | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mediaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attemptRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);

  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const demoModeRef = useRef(false);
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meetingTitle = useMemo(
    () => (conferenceId ? `Meeting ${conferenceId}` : "Cognicx Meet"),
    [conferenceId]
  );

  useEffect(() => {
    setParticipants([
      {
        id: "local-user",
        name: userName || "You",
        isMuted,
        isSpeaking: false,
        isLocal: true,
      },
    ]);
  }, [userName, conferenceId, isMuted]);

  useEffect(() => {
    const resumeAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => undefined);
      }
    };
    document.addEventListener("click", resumeAudio);
    document.addEventListener("touchstart", resumeAudio);
    return () => {
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("touchstart", resumeAudio);
    };
  }, []);

  const activateDemoMode = (reason?: string) => {
    if (demoModeRef.current) return;
    demoModeRef.current = true;
    setConnectionState(reason ? `Offline Demo (${reason})` : "Offline Demo");
    setParticipants((prev) => {
      const local = prev.find((p) => p.isLocal) || {
        id: "local-user",
        name: userName || "You",
        isMuted,
        isSpeaking: false,
        isLocal: true,
      };

      return [
        local,
        {
          id: "p-1",
          name: "Priya D.",
          isMuted: false,
          isSpeaking: false,
          isLocal: false,
        },
        {
          id: "p-2",
          name: "Alex R.",
          isMuted: true,
          isSpeaking: false,
          isLocal: false,
        },
      ];
    });
  };

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SIP_SOCKET_URL;

    if (!socketUrl) {
      activateDemoMode("No signaling URL configured");
      return;
    }

    setConnectionState((prev) =>
      prev === "Connected" ? prev : "Connecting to Topic..."
    );
    demoModeRef.current = false;

    const client: Client = Stomp.over(() => new SockJS(socketUrl));
    client.debug = () => {};
    stompClientRef.current = client;

    client.connect(
      {},
      () => {
        if (!stompClientRef.current) return;
        demoModeRef.current = false;

        const subscription = stompClientRef.current.subscribe(
          `/topic/conference/${conferenceId || "default"}`,
          (message: Message) => {
            try {
              const payload = JSON.parse(message.body);
              const status = String(payload.status || "").toUpperCase();
              const participantId =
                payload.channel ||
                payload.callerIdNum ||
                payload.callerIdName ||
                payload.conferenceId;

              if (!participantId) return;

              const participantName =
                payload.callerIdName ||
                payload.callerIdNum ||
                `Participant ${participantId}`;

              setParticipants((prev) => {
                const local = prev.find((p) => p.isLocal) || {
                  id: "local-user",
                  name: userName || "You",
                  isMuted,
                  isSpeaking: false,
                  isLocal: true,
                };

                let remotes = prev.filter((p) => !p.isLocal);
                const existingIndex = remotes.findIndex(
                  (p) => p.id === participantId
                );

                if (status === "LEFT") {
                  remotes = remotes.filter((p) => p.id !== participantId);
                } else {
                  const existing =
                    existingIndex >= 0 ? remotes[existingIndex] : undefined;
                  const isMutedFromStatus =
                    status === "MUTED"
                      ? true
                      : status === "UNMUTED"
                        ? false
                        : Boolean(payload.muted);

                  const updated: Participant = {
                    id: participantId,
                    name: participantName,
                    isMuted: isMutedFromStatus,
                    isSpeaking: existing?.isSpeaking || false,
                    isLocal: false,
                  };

                  if (existingIndex >= 0) {
                    remotes[existingIndex] = {
                      ...existing,
                      ...updated,
                    };
                  } else {
                    remotes.push(updated);
                  }
                }

                return [local, ...remotes];
              });
            } catch (error) {
              setConnectionState("Error");
            }
          }
        );

        subscriptionRef.current = subscription;
      },
      () => {
        activateDemoMode("Unable to reach signaling server");
      }
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      stompClientRef.current?.disconnect(() => undefined);
      stompClientRef.current = null;
    };
  }, [conferenceId, userName, isMuted]);

  useEffect(() => {
    speakingIntervalRef.current = setInterval(() => {
      if (!demoModeRef.current) return;
      setParticipants((prev) =>
        prev.map((p) =>
          p.isLocal
            ? p
            : {
                ...p,
                isSpeaking: Math.random() > 0.6,
              }
        )
      );
    }, 1800);

    return () => {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (demoModeRef.current) return;
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? p : { ...p, isSpeaking: isRemoteSpeaking }))
    );
  }, [isRemoteSpeaking]);

  useEffect(() => {
    const rotateTimer = setInterval(() => {
      if (!demoModeRef.current) return;
      setParticipants((prev) =>
        prev.map((p, idx) =>
          p.isLocal
            ? p
            : {
                ...p,
                isMuted: idx % 2 === 0 ? !p.isMuted : p.isMuted,
              }
        )
      );
    }, 8000);

    const guestTimer = setInterval(() => {
      if (!demoModeRef.current) return;
      setParticipants((prev) => {
        const hasGuest = prev.some((p) => p.id === "p-guest");
        if (hasGuest) {
          return prev.filter((p) => p.id !== "p-guest");
        }

        return [
          ...prev,
          {
            id: "p-guest",
            name: "Guest Speaker",
            isMuted: false,
            isSpeaking: true,
            isLocal: false,
          },
        ];
      });
    }, 12000);

    return () => {
      clearInterval(rotateTimer);
      clearInterval(guestTimer);
    };
  }, []);

  const cleanup = async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaTimeoutRef.current) {
      clearTimeout(mediaTimeoutRef.current);
      mediaTimeoutRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => undefined);
    }

    if (sessionRef.current) {
      try {
        const state = sessionRef.current.state;
        if (state === "Established" || state === "Establishing") {
          sessionRef.current.bye();
        } else if (state === "Initial") {
          sessionRef.current.cancel();
        }
      } catch (error) {
        console.warn("Session cleanup error", error);
      }
      sessionRef.current = null;
    }

    if (uaRef.current) {
      try {
        // @ts-expect-error sip.js types keep status private
        if ((uaRef.current as any).status !== "Stopped") {
          await uaRef.current.stop();
        }
      } catch (error) {
        console.warn("UA stop error", error);
      }
      uaRef.current = null;
    }
  };

  const handleConnect = async () => {
    const currentAttemptId = ++attemptRef.current;
    await cleanup();
    if (currentAttemptId !== attemptRef.current) return;

    setErrorMsg(null);
    setWarningMsg(null);
    setConnectionState("Initializing...");

    try {
      if (!window.isSecureContext) {
        setErrorMsg("Insecure Context Detected. Please use HTTPS or localhost.");
        setConnectionState("Error");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMsg("Microphone access is not supported in this browser.");
        setConnectionState("Error");
        return;
      }

      setConnectionState("Requesting Mic...");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err: any) {
        if (currentAttemptId !== attemptRef.current) return;
        setConnectionState("Error");
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMsg("Microphone permission denied. Please allow microphone access.");
        } else {
          setErrorMsg(`Failed to access microphone: ${err.message}`);
        }
        return;
      }

      setConnectionState("Connecting to Server...");
      if (currentAttemptId !== attemptRef.current) return;

      const server = "wss://cognicx.callanywhere.co.in:8089/ws";
      const domain = "cognicx.callanywhere.co.in";
      const user = "webconf";
      const pass = "webconf";

      const uri = UserAgent.makeURI(`sip:${user}@${domain}`);
      if (!uri) {
        setErrorMsg("Invalid SIP configuration.");
        setConnectionState("Error");
        return;
      }

      const ua = new UserAgent({
        uri,
        authorizationUsername: user,
        authorizationPassword: pass,
        transportOptions: {
          server,
          traceSip: true,
          connectionTimeout: 10,
          keepAliveInterval: 30,
        },
        sessionDescriptionHandlerFactoryOptions: {
          constraints: {
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
          },
        },
        register: false,
        userAgentString: "Cognicx Meet Client",
      });

      uaRef.current = ua;

      // @ts-expect-error sip.js events are not fully typed
      ua.transport.stateChange.addListener((state: string) => {
        if (currentAttemptId !== attemptRef.current) return;

        if (state === "Disconnected") {
          if (connectionState !== "Terminated" && connectionState !== "Error") {
            if (reconnectAttemptsRef.current < 3) {
              setWarningMsg(
                `Connection lost. Reconnecting (Attempt ${
                  reconnectAttemptsRef.current + 1
                }/3)...`
              );
              reconnectAttemptsRef.current += 1;
              setTimeout(() => {
                if (uaRef.current && (uaRef.current as any).transport.state === "Disconnected") {
                  (uaRef.current as any).transport
                    .connect()
                    .catch(() => console.warn("Reconnection failed"));
                }
              }, 2000);
            } else {
              setWarningMsg(null);
              setConnectionState("Error");
              setErrorMsg("Lost connection to the server. Please retry.");
            }
          }
        } else if (state === "Connected") {
          setWarningMsg(null);
          reconnectAttemptsRef.current = 0;
        }
      });

      try {
        await ua.start();
      } catch (err: any) {
        if (currentAttemptId !== attemptRef.current) return;
        setConnectionState("Error");
        setErrorMsg("Could not connect to SIP server. Firewall or SSL/WSS issue detected.");
        return;
      }

      if (currentAttemptId !== attemptRef.current) {
        ua.stop();
        return;
      }

      setConnectionState("Calling...");

      const targetURI = UserAgent.makeURI(`sip:${user}@${domain}`);
      if (!targetURI) {
        setErrorMsg("Invalid Target URI");
        setConnectionState("Error");
        return;
      }

      const inviter = new Inviter(ua, targetURI, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
        extraHeaders: [
          `X-Meeting-Id: ${conferenceId.trim()}`,
          `X-Caller-Name: ${userName.trim()}`,
        ],
      });

      sessionRef.current = inviter;
      setupSessionListeners(inviter, currentAttemptId);

      inviter
        .invite()
        .then(() => undefined)
        .catch((e: any) => {
          if (currentAttemptId !== attemptRef.current) return;
          setConnectionState("Error");
          setErrorMsg("Failed to connect to conference: " + (e?.message || "Unknown error"));
        });
    } catch (err: any) {
      if (currentAttemptId !== attemptRef.current) return;
      setConnectionState("Error");
      setErrorMsg(err?.message || "Connection failed unexpectedly");
    }
  };

  const checkSipConnection = () => {
    let sip = "Disconnected";
    let transport = "Unknown";
    let mic = "Unknown";

    if (uaRef.current) {
      // @ts-expect-error sip.js private api
      sip = (uaRef.current as any).isConnected?.() ? "Connected" : "Disconnected";
    } else {
      sip = "Not Initialized";
    }

    if (sessionRef.current && (sessionRef.current as any).sessionDescriptionHandler) {
      // @ts-expect-error sip.js handler typing
      const pc = (sessionRef.current as any).sessionDescriptionHandler.peerConnection;
      if (pc) {
        transport = pc.connectionState;
      } else {
        transport = "No Peer Connection";
      }
    } else {
      transport = "No Active Session";
    }

    if (!window.isSecureContext) {
      mic = "Insecure Context (Failed)";
    } else if (connectionState === "Error" && errorMsg?.includes("Microphone")) {
      mic = "Blocked/Missing";
    } else if (audioContextRef.current && audioContextRef.current.state === "running") {
      mic = "Active";
    } else {
      mic = "Granted (Idle)";
    }

    setDiagnostics({ sipStatus: sip, transportStatus: transport, micStatus: mic });
    setShowStatusModal(true);
  };

  const handleRetry = () => {
    reconnectAttemptsRef.current = 0;
    setShowStatusModal(false);
    handleConnect();
  };

  useEffect(() => {
    handleConnect();
    return () => {
      attemptRef.current += 1;
      cleanup();
    };
  }, [conferenceId, userName]);

  const setupSessionListeners = (inviter: Inviter, myAttemptId: number) => {
    inviter.stateChange.addListener((state: string) => {
      if (myAttemptId !== attemptRef.current) return;

      switch (state) {
        case "Initial":
          setConnectionState("Initializing...");
          break;
        case "Establishing":
          setConnectionState("Calling...");
          break;
        case "Established":
          setConnectionState("Connected");
          handleRemoteStream(inviter);
          if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
          mediaTimeoutRef.current = setTimeout(() => {
            if (!remoteAudioRef.current?.srcObject) {
              setWarningMsg("Connected, but no audio received yet.");
            }
          }, 8000);
          break;
        case "Terminated":
          setConnectionState("Terminated");
          if (mediaTimeoutRef.current) clearTimeout(mediaTimeoutRef.current);
          setTimeout(() => {
            if (myAttemptId === attemptRef.current) onLeave();
          }, 1000);
          break;
        default:
          break;
      }
    });

    inviter.delegate = {
      onProgress: () => {
        if (myAttemptId !== attemptRef.current) return;
        checkAndAttachMedia(inviter);
      },
      onAccept: () => {
        if (myAttemptId !== attemptRef.current) return;
        checkAndAttachMedia(inviter);
      },
    };
  };

  const checkAndAttachMedia = (inviter: Inviter) => {
    // @ts-expect-error sip.js handler typing
    const handler = inviter.sessionDescriptionHandler;
    if (!handler) return;
    const pc = handler.peerConnection;
    if (!pc) return;

    if (!(pc as any).hasAttachedConnectionState) {
      pc.addEventListener("connectionstatechange", () => {
        if (pc.connectionState === "failed") {
          setErrorMsg("Network firewall blocking connection (ICE Failed).");
        } else if (pc.connectionState === "disconnected") {
          setWarningMsg("Connection interrupted. Reconnecting...");
        } else if (pc.connectionState === "connected") {
          setWarningMsg(null);
        }
      });
      (pc as any).hasAttachedConnectionState = true;
    }

    const receivers = pc.getReceivers();
    const audioReceiver = receivers.find((r) => r.track && r.track.kind === "audio");
    if (audioReceiver?.track) {
      attachStream(new MediaStream([audioReceiver.track]));
    }

    if (!(pc as any).hasAttachedOntrack) {
      pc.ontrack = (event: RTCTrackEvent) => {
        if (event.streams && event.streams[0]) {
          attachStream(event.streams[0]);
        } else if (event.track) {
          attachStream(new MediaStream([event.track]));
        }
      };
      (pc as any).hasAttachedOntrack = true;
    }
  };

  const handleRemoteStream = (inviter: Inviter) => {
    checkAndAttachMedia(inviter);
  };

  const attachStream = (stream: MediaStream) => {
    if (mediaTimeoutRef.current) {
      clearTimeout(mediaTimeoutRef.current);
      mediaTimeoutRef.current = null;
    }
    setWarningMsg(null);

    if (remoteAudioRef.current) {
      const newTrackId = stream.getAudioTracks()[0]?.id;
      const currentSrc = remoteAudioRef.current.srcObject as MediaStream | null;
      const currentTrackId = currentSrc?.getAudioTracks()[0]?.id;

      if (!currentSrc || currentTrackId !== newTrackId) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;

        const playPromise = remoteAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAutoplayBlocked(false);
              setWarningMsg(null);
            })
            .catch((e) => {
              if (e.name === "NotAllowedError") {
                setAutoplayBlocked(true);
                setWarningMsg("Browser blocked audio. Click 'Start Audio' to listen.");
              } else {
                setWarningMsg("Playback error: " + e.message);
              }
            });
        }

        setupAudioAnalysis(stream);
      }
    }
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => undefined);
      }
      if (analyserRef.current) return;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const detect = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          sum += data[i];
        }
        const avg = sum / data.length;
        setIsRemoteSpeaking(avg > 10);
        rafRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (error) {
      console.error("Audio Analysis Setup Error", error);
    }
  };

  const toggleMute = () => {
    const session = sessionRef.current;
    if (!session) return;
    // @ts-expect-error sip.js handler typing
    const handler = session.sessionDescriptionHandler;
    const pc = handler?.peerConnection;
    if (!pc) return;
    const senders = pc.getSenders();
    const audioSender = senders.find((s) => s.track && s.track.kind === "audio");
    if (audioSender?.track) {
      const newEnabled = !audioSender.track.enabled;
      audioSender.track.enabled = newEnabled;
      setIsMuted(!newEnabled);
      setParticipants((prev) =>
        prev.map((p) =>
          p.isLocal
            ? {
                ...p,
                isMuted: !newEnabled,
              }
            : p
        )
      );
    } else {
      setWarningMsg("Microphone track not found.");
      setTimeout(() => setWarningMsg(null), 3000);
    }
  };

  const handleEnableAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current
        .play()
        .then(() => {
          setAutoplayBlocked(false);
          setWarningMsg(null);
          if (audioContextRef.current?.state === "suspended") {
            audioContextRef.current.resume();
          }
        })
        .catch(() => undefined);
    }
  };

  const handleGenerateLink = () => {
    const expiryTime = Date.now() + inviteValidity * 60 * 1000;
    const data = JSON.stringify({ rid: conferenceId, exp: expiryTime });
    const token = btoa(data);
    const url = `${window.location.origin}${window.location.pathname}?room=${conferenceId}&token=${token}`;
    setGeneratedLink(url);
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).catch(() => undefined);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setGeneratedLink(null);
  };

  const statusBadge = (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm border transition-colors ${
        connectionState === "Connected"
          ? "bg-green-500/20 text-green-100 border-green-500/30"
          : connectionState === "Error"
            ? "bg-red-500/20 text-red-100 border-red-500/30"
            : "bg-yellow-500/20 text-yellow-100 border-yellow-500/30"
      }`}
    >
      {connectionState === "Connected" ? (
        <SignalIcon className="w-4 h-4" />
      ) : (
        <SignalOffIcon className="w-4 h-4" />
      )}
      <span>{connectionState === "Connected" ? `${conferenceId}` : connectionState}</span>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#0f1512] text-white overflow-hidden">
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ position: "absolute", top: 0, left: 0, opacity: 0, pointerEvents: "none" }}
      />

      {errorMsg && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4">
          <div className="bg-red-600/95 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-red-400 max-w-2xl w-full">
            <div className="flex-1">
              <p className="font-bold uppercase text-xs tracking-wider opacity-90 mb-1">Connection Error</p>
              <p className="text-sm md:text-base font-medium">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
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
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4">
          <div className="bg-yellow-600/95 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-yellow-400 max-w-2xl w-full">
            <div className="flex-1">
              <p className="font-bold uppercase text-xs tracking-wider opacity-90 mb-1">Notice</p>
              <p className="text-sm md:text-base font-medium">{warningMsg}</p>
            </div>
            <button
              onClick={() => setWarningMsg(null)}
              className="p-2 hover:bg-white/10 rounded-full transition font-bold px-4 bg-white/10"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {autoplayBlocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="text-center p-8 bg-[#3c4043] rounded-2xl shadow-2xl border border-gray-600 max-w-md">
            <h3 className="text-2xl font-bold mb-4 text-[#8ab4f8]">Enable Audio</h3>
            <p className="mb-8 text-gray-300 text-lg">Your browser has blocked audio autoplay. Click the button below to join the conversation.</p>
            <button
              onClick={handleEnableAudio}
              className="px-8 py-4 bg-[#8ab4f8] text-[#202124] font-bold text-lg rounded-full hover:bg-[#a6c8ff] transition transform hover:scale-105 shadow-lg"
            >
              Start Audio
            </button>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={closeInviteModal}
        >
          <div
            className="bg-[#303134] w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#3c4043] p-4 border-b border-gray-600 flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#8ab4f8]">
                <LinkIcon className="w-5 h-5" />
                <h3 className="text-lg font-medium text-white">Invite Customer</h3>
              </div>
              <button onClick={closeInviteModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!generatedLink ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      Link Validity
                    </label>
                    <select
                      value={inviteValidity}
                      onChange={(e) => setInviteValidity(Number(e.target.value))}
                      className="w-full bg-[#202124] border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#8ab4f8] focus:outline-none"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={120}>2 Hours</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      This link will expire automatically after the selected duration. The customer will be able to join your room: <span className="text-white">{conferenceId}</span>.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateLink}
                    className="w-full py-3 bg-[#8ab4f8] text-[#202124] font-bold rounded-lg hover:bg-[#a6c8ff] transition-colors"
                  >
                    Generate Secure Link
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#202124] p-4 rounded-lg border border-green-500/30">
                    <p className="text-xs text-green-400 font-bold uppercase mb-1">Link Generated Successfully</p>
                    <p className="text-xs text-gray-500 mb-3">Share this link with the customer.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        className="flex-1 bg-[#303134] border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none"
                      />
                      <button
                        onClick={copyLink}
                        className="bg-[#3c4043] hover:bg-[#4b4f54] text-white p-2 rounded border border-gray-600"
                        title="Copy to clipboard"
                      >
                        <CopyIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setGeneratedLink(null)}
                    className="w-full py-2 text-[#8ab4f8] hover:bg-[#8ab4f8]/10 rounded transition-colors text-sm"
                  >
                    Generate Another Link
                  </button>
                </div>
              )}
            </div>
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
              <h3 className="text-lg font-medium text-white">Connection Health</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${diagnostics.sipStatus === "Connected" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                  >
                    {diagnostics.sipStatus === "Connected" ? <SignalIcon className="w-5 h-5" /> : <SignalOffIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">SIP Server</p>
                    <p className="text-xs text-gray-500">{diagnostics.sipStatus}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${diagnostics.transportStatus === "connected" ? "bg-green-500/20 text-green-400" : diagnostics.transportStatus === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}
                  >
                    <SignalIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Media Transport (ICE)</p>
                    <p className="text-xs text-gray-500 capitalize">{diagnostics.transportStatus}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${diagnostics.micStatus === "Active" ? "bg-green-500/20 text-green-400" : diagnostics.micStatus === "Blocked/Missing" || diagnostics.micStatus.includes("Insecure") ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}
                  >
                    <SignalIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Microphone</p>
                    <p className="text-xs text-gray-500">{diagnostics.micStatus}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] py-2 rounded font-medium transition-colors"
                >
                  {diagnostics.sipStatus !== "Connected" ? "Retry Connection" : "Reconnect"}
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

      <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start">
        <div className="bg-black/40 backdrop-blur-md p-2 rounded-lg flex items-center gap-2 shadow-sm pointer-events-auto">
          <img src={LOGO_SRC} alt="Cognicx" className="h-6 w-auto object-contain" />
          <span className="text-white/90 font-medium text-sm hidden sm:block tracking-wide">Cognicx Meet</span>
        </div>

        <div className="flex justify-center pointer-events-auto">
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
            ></div>
            <span>{connectionState === "Connected" ? `${conferenceId}` : connectionState}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        <div className="w-[120px] hidden sm:block"></div>
      </div>

      <div className="flex flex-1 w-full overflow-hidden relative">
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isParticipantListOpen ? "mr-0 md:mr-80 lg:mr-96" : ""
          }`}
        >
          <div className="px-4 sm:px-6 pb-4 text-gray-300 text-sm">
            You are connected. Invite teammates by sharing the meeting ID and keep this tab open.
          </div>
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
        conferenceId={conferenceId || "Conference"}
        onToggleParticipantList={() => setIsParticipantListOpen(!isParticipantListOpen)}
        isParticipantListOpen={isParticipantListOpen}
        onInviteClick={() => setShowInviteModal(true)}
      />
    </div>
  );
};

export default ConferenceScreen;
