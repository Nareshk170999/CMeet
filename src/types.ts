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
  | "Connecting to Topic..."
  | "Registering..."
  | "Calling..."
  | "Connected"
  | "Offline Demo"
  | `Offline Demo (${string})`
  | "Terminated"
  | "Error";

// Mocking the global SIP variable for TS
declare global {
  var SIP: any;
}