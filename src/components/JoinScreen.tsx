import React, { useState } from "react";
import { VideoIcon, MicIcon } from "./Icons";

interface JoinScreenProps {
  onJoin: (name: string, confId: string) => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [name, setName] = useState("");
  const [confId, setConfId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && confId) {
      setIsLoading(true);
      onJoin(name.trim(), confId.trim());
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#202124] text-white overflow-hidden">
      {/* Left: logo + form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center md:items-start mb-8">
            <img
              src="https://i.postimg.cc/4xS2G4WJ/image.png"
              alt="Cognicx Meet"
              className="h-16 md:h-20 object-contain mb-4"
            />
            <h1 className="text-3xl md:text-4xl font-normal text-[#e8eaed]">
              Cognicx Meet
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <VideoIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#8ab4f8] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Conference ID"
                  value={confId}
                  onChange={(e) => setConfId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#3c4043] border border-transparent rounded focus:outline-none focus:ring-2 focus:ring-[#8ab4f8] text-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MicIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#8ab4f8] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#3c4043] border border-transparent rounded focus:outline-none focus:ring-2 focus:ring-[#8ab4f8] text-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 bg-[#8ab4f8] text-[#202124] font-medium rounded hover:bg-[#a6c8ff] transition-colors flex items-center justify-center ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Connecting..." : "Join Meeting"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right visual */}
      <div className="hidden md:flex flex-1 items-center justify-center p-8 bg-[#202124]">
        <div className="relative w-full max-w-lg aspect-video bg-[#3c4043] rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
          <div className="text-gray-500 flex flex-col items-center">
            <img
              src="https://i.postimg.cc/4xS2G4WJ/image.png"
              alt="Logo"
              className="h-24 opacity-20 mb-4"
            />
            <p className="text-xl font-medium opacity-50">
              Secure SIP Conferencing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinScreen;
