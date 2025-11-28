export interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isLocal: boolean;
}

export type ConnectionState = 
  | "Idle"
  | "Initializing..."
  | "Requesting Mic..."
  | "Connecting to Server..."
  | "Registering..."
  | "Calling..."
  | "Connected"
  | "Terminated"
  | "Error";

// Mocking the global SIP variable for TS
declare global {
  var SIP: any;
}