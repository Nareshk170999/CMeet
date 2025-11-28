import React, { useEffect, useMemo, useRef, useState } from "react";
import { ConnectionState, Participant } from "../types";
import ControlBar from "./ControlBar";
import ParticipantGrid from "./ParticipantGrid";
import ParticipantListSidebar from "./ParticipantListSidebar";
import { SignalIcon, SignalOffIcon } from "./Icons";

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
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const connectionRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoModeRef = useRef(false);

  const meetingTitle = useMemo(
    () => (conferenceId ? `Meeting ${conferenceId}` : "Cognicx Meet"),
    [conferenceId]
  );

  useEffect(() => {
    demoModeRef.current = false;
    setConnectionState("Connecting to Server...");
    const endpoint =
      import.meta.env.VITE_SIGNALING_URL || "wss://echo.websocket.events";

    let settled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const clearHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    const activateDemoMode = (reason?: string) => {
      if (demoModeRef.current) return;
      demoModeRef.current = true;
      settled = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      clearHeartbeat();
      connectionRef.current?.close();
      connectionRef.current = null;
      setConnectionState(
        reason ? `Offline Demo (${reason})` : "Offline Demo"
      );
    };

    const ws = new WebSocket(endpoint);
    connectionRef.current = ws;

    fallbackTimer = setTimeout(() => {
      if (!settled || connectionRef.current?.readyState !== WebSocket.OPEN) {
        activateDemoMode("No signaling response");
      }
    }, 3500);

    ws.onopen = () => {
      if (demoModeRef.current) return;
      settled = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      setConnectionState("Connected");

      const joinPayload = {
        type: "join",
        room: conferenceId || "demo-room",
        name: userName || "Guest",
        ts: Date.now(),
      };

      ws.send(JSON.stringify(joinPayload));

      heartbeatRef.current = setInterval(() => {
        if (connectionRef.current?.readyState === WebSocket.OPEN) {
          connectionRef.current.send(
            JSON.stringify({ type: "ping", ts: Date.now() })
          );
        }
      }, 15000);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      if (demoModeRef.current) return;
      settled = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "participants" && Array.isArray(payload.items)) {
          setParticipants((prev) => {
            const others = prev.filter((p) => p.isLocal);
            const remotes: Participant[] = payload.items.map((item: any) => ({
              id: item.id || item.name,
              name: item.name || "Guest",
              isMuted: Boolean(item.isMuted),
              isSpeaking: Boolean(item.isSpeaking),
              isLocal: false,
            }));
            return [...others, ...remotes];
          });
        }

        if (payload.type === "pong") {
          setConnectionState("Connected");
          return;
        }

        if (payload.type === "join") {
          setConnectionState("Connected");
        }
      } catch (err) {
        // Ignore non-JSON messages from the echo server but keep the session alive.
        setConnectionState("Connected");
      }
    };

    ws.onerror = () => {
      activateDemoMode("Unable to reach signaling server");
    };

    ws.onclose = (event: CloseEvent) => {
      if (demoModeRef.current) return;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      clearHeartbeat();

      if (!settled || event.code === 1006) {
        activateDemoMode("Connection lost");
      } else {
        setConnectionState((prev) =>
          prev === "Error" ? "Error" : "Terminated"
        );
      }
    };

    return () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      clearHeartbeat();
      connectionRef.current?.close();
      connectionRef.current = null;
    };
  }, [conferenceId, userName]);

  useEffect(() => {
    // Seed the room with the local participant plus a couple of friendly faces.
    const seeded: Participant[] = [
      {
        id: "local-user",
        name: userName || "You",
        isMuted,
        isSpeaking: false,
        isLocal: true,
      },
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
    setParticipants(seeded);
  }, [userName]);

  useEffect(() => {
    // Keep the local mute flag in sync without resetting the whole roster.
    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal
          ? {
              ...p,
              isMuted,
            }
          : p
      )
    );
  }, [isMuted]);

  useEffect(() => {
    // Give remote participants a chance to "speak" so the visualizers animate.
    speakingIntervalRef.current = setInterval(() => {
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
    // Lightweight fallback to make the UI feel reactive even if the signaling
    // server is unavailable. We softly rotate who is muted and add/remove a
    // guest to demonstrate live updates.
    const rotateTimer = setInterval(() => {
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

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
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
      <span>{connectionState}</span>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#0f1512] text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f1512] via-[#0f1914] to-[#0a100d]" />

      <div className="relative z-10 h-full flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <img src={LOGO_SRC} alt="Cognicx Meet" className="h-10 w-auto" />
            <div>
              <p className="text-sm text-gray-400">{meetingTitle}</p>
              <p className="text-lg font-semibold text-white">{userName}</p>
            </div>
          </div>
          {statusBadge}
        </header>

        <main className="flex flex-1 w-full overflow-hidden relative">
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ${
              isParticipantListOpen ? "mr-0 md:mr-80 lg:mr-96" : ""
            }`}
          >
            <div className="px-4 sm:px-6 pb-4 text-gray-300 text-sm">
              You are connected. Invite teammates by sharing the meeting ID and
              keep this tab open.
            </div>
            <ParticipantGrid participants={participants} />
          </div>

          <ParticipantListSidebar
            participants={participants}
            isOpen={isParticipantListOpen}
            onClose={() => setIsParticipantListOpen(false)}
          />
        </main>

        <ControlBar
          isMuted={isMuted}
          toggleMute={toggleMute}
          onLeave={onLeave}
          conferenceId={conferenceId || "Conference"}
          onToggleParticipantList={() =>
            setIsParticipantListOpen(!isParticipantListOpen)
          }
          isParticipantListOpen={isParticipantListOpen}
        />
      </div>
    </div>
  );
};

export default ConferenceScreen;
