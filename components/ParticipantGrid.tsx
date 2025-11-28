import React from "react";
import { Participant } from "../types";
import { MicOffIcon } from "./Icons";

interface ParticipantGridProps {
  participants: Participant[];
}

const ParticipantGrid: React.FC<ParticipantGridProps> = ({ participants }) => {
  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-3 md:grid-cols-4";
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center mb-20">
      <div
        className={`grid gap-4 w-full max-w-6xl ${getGridClass(
          participants.length
        )} auto-rows-[260px] md:auto-rows-[320px]`}
      >
        {participants.map((p) => (
          <div
            key={p.id}
            className={`relative bg-[#3c4043] rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 transition-all duration-200 ${
              p.isSpeaking ? "border-[#8ab4f8]" : "border-transparent"
            }`}
          >
            {/* Avatar */}
            <div
              className={`relative rounded-full h-28 w-28 flex items-center justify-center text-3xl font-medium text-white select-none ${
                p.isLocal ? "bg-purple-600" : "bg-green-600"
              }`}
            >
              {p.name.substring(0, 2).toUpperCase()}

              {p.isSpeaking && (
                <div className="absolute inset-0 rounded-full border-2 border-[#8ab4f8] animate-pulse" />
              )}
            </div>

            {/* Speaking visualizer */}
            {p.isSpeaking && (
              <div className="absolute bottom-16 flex gap-1">
                <div
                  className="w-1 h-3 bg-[#8ab4f8] animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1 h-5 bg-[#8ab4f8] animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1 h-3 bg-[#8ab4f8] animate-bounce"
                  style={{ animationDelay: "75ms" }}
                />
              </div>
            )}

            {/* Name tag */}
            <div className="absolute bottom-4 left-4 text-white text-sm font-medium flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
              <span>
                {p.name} {p.isLocal ? "(You)" : ""}
              </span>
              {p.isMuted && <MicOffIcon className="w-4 h-4 text-red-400" />}
            </div>

            {/* Local mute badge */}
            {p.isLocal && p.isMuted && (
              <div className="absolute top-4 right-4 bg-[#202124]/80 p-2 rounded-full">
                <MicOffIcon className="w-5 h-5 text-red-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantGrid;
