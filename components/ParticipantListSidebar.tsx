import React from "react";
import { Participant } from "../types";
import { MicOffIcon, MicIcon, MoreVerticalIcon } from "./Icons";

interface ParticipantListSidebarProps {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantListSidebar: React.FC<ParticipantListSidebarProps> = ({
  participants,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 md:w-96 bg-[#202124] border-l border-gray-800 shadow-2xl z-[40] flex flex-col pt-20 pb-24">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h2 className="text-white text-lg font-medium">
          People ({participants.length})
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Search (visual only) */}
      <div className="px-4 py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search for people"
            className="w-full bg-[#202124] border border-gray-600 text-white text-sm rounded-md focus:ring-1 focus:ring-[#8ab4f8] focus:border-[#8ab4f8] pl-10 p-2.5 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 hover:bg-[#3c4043] rounded-lg group transition-colors cursor-default"
          >
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium text-white select-none bg-purple-600">
              {p.name.substring(0, 1).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium truncate">
                  {p.name}
                </p>
                {p.isLocal && (
                  <span className="text-gray-400 text-xs">(You)</span>
                )}
              </div>
              <p className="text-gray-400 text-xs">
                {p.isLocal ? "Meeting Host" : "Participant"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {p.isSpeaking && (
                <div className="flex gap-0.5 items-end h-3">
                  <div className="w-0.5 h-2 bg-[#8ab4f8] animate-pulse" />
                  <div className="w-0.5 h-3 bg-[#8ab4f8] animate-pulse delay-75" />
                  <div className="w-0.5 h-1 bg-[#8ab4f8] animate-pulse delay-150" />
                </div>
              )}

              {p.isMuted ? (
                <button className="p-2 hover:bg-gray-600 rounded-full">
                  <MicOffIcon className="w-4 h-4 text-red-400" />
                </button>
              ) : (
                <button className="p-2 hover:bg-gray-600 rounded-full">
                  <MicIcon className="w-4 h-4 text-white" />
                </button>
              )}

              <button className="p-2 hover:bg-gray-600 rounded-full text-gray-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVerticalIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantListSidebar;
