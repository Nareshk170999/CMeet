import React from "react";
import {
  MicIcon,
  MicOffIcon,
  PhoneHangupIcon,
  InfoIcon,
  UsersIcon,
  MoreVerticalIcon,
} from "./Icons";

interface ControlBarProps {
  isMuted: boolean;
  toggleMute: () => void;
  onLeave: () => void;
  conferenceId: string;
  onToggleParticipantList?: () => void;
  isParticipantListOpen?: boolean;
}

const ControlBar: React.FC<ControlBarProps> = ({
  isMuted,
  toggleMute,
  onLeave,
  conferenceId,
  onToggleParticipantList,
  isParticipantListOpen,
}) => {
  const formatTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <footer className="fixed bottom-0 left-0 w-full h-20 bg-[#0f1512] border-t border-[#1f2c25] flex items-center justify-between px-4 sm:px-6 z-50">
      {/* Left info */}
      <div className="hidden md:flex items-center gap-3 text-white min-w-[200px]">
        <span className="font-medium text-sm md:text-base">{formatTime()}</span>
        <div className="h-4 w-px bg-gray-600" />
        <span className="text-sm font-medium text-gray-300 truncate max-w-[150px]">
          {conferenceId}
        </span>
      </div>

      {/* Center controls */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggleMute}
          className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-[#1f2c25] hover:bg-[#274030] text-[#e4f3e7]"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOffIcon className="w-5 h-5" />
          ) : (
            <MicIcon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onLeave}
          className="h-10 w-12 md:h-12 md:w-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white"
          title="Leave call"
        >
          <PhoneHangupIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 min-w-[200px] justify-end text-white">
        <button
          className="hidden md:flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#3c4043]"
          title="Meeting details"
        >
          <InfoIcon className="w-6 h-6" />
        </button>

        <button
          onClick={onToggleParticipantList}
          className={`h-10 w-10 flex items-center justify-center rounded-full transition-colors ${
            isParticipantListOpen
              ? "bg-[#66d39d] text-[#0f1512]"
              : "hover:bg-[#1f2c25] text-white"
          }`}
          title="Show everyone"
        >
          <UsersIcon className="w-6 h-6" />
        </button>

        <button
          className="hidden md:flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#3c4043]"
          title="More options"
        >
          <MoreVerticalIcon className="w-6 h-6" />
        </button>
      </div>
    </footer>
  );
};

export default ControlBar;
