import React, { useState } from "react";
import JoinScreen from "./components/JoinScreen";
import ConferenceScreen from "./components/ConferenceScreen";

function App() {
  const [isInCall, setIsInCall] = useState(false);
  const [credentials, setCredentials] = useState({ name: "", confId: "" });

  const handleJoin = (name: string, confId: string) => {
    setCredentials({ name, confId });
    setIsInCall(true);
  };

  const handleLeave = () => {
    setIsInCall(false);
    setCredentials({ name: "", confId: "" });
  };

  return (
    <div className="min-h-screen w-full bg-[#0f1512]">
      {!isInCall ? (
        <JoinScreen onJoin={handleJoin} />
      ) : (
        <ConferenceScreen
          conferenceId={credentials.confId}
          userName={credentials.name}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}

export default App;
