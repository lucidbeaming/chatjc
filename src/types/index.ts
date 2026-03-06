export interface ChatRequest {
  session_id?: string;
  message: string;
  source: "web_component" | "api";
}

export interface ChatResponse {
  session_id: string;
  response: string;
  timestamp: string;
}

export interface Message {
  id: string;
  session_id: string;
  timestamp: string;
  role: "user" | "assistant";
  content: string;
  ip_address: string | null;
  source: string;
  created_at: string;
}

export interface Session {
  id: string;
  ip_address: string | null;
  source: string;
  created_at: string;
  last_active_at: string | null;
}
