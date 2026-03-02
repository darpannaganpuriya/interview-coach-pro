import { useState, useRef, useCallback } from "react";
import { startInterview, endInterview, getInterviewWebSocketURL } from "@/services/api";

interface TranscriptEntry {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
}

export function useInterview() {
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const start = useCallback(async (jdId: string, resumeId: string) => {
    setIsStarting(true);
    try {
      const { sessionId: sid } = await startInterview(jdId, resumeId);
      setSessionId(sid);

      // Connect WebSocket
      const wsUrl = getInterviewWebSocketURL(sid);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => setIsConnected(false);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "transcript") {
            setTranscript((prev) => [
              ...prev,
              { role: data.role, content: data.content, timestamp: Date.now() },
            ]);
          }
        } catch {
          // Handle non-JSON messages
        }
      };

      wsRef.current = ws;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (sessionId) {
      await endInterview(sessionId);
    }
    setIsConnected(false);
  }, [sessionId]);

  const sendAudio = useCallback((audioBlob: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioBlob);
    }
  }, []);

  return {
    isConnected,
    isStarting,
    transcript,
    sessionId,
    start,
    stop,
    sendAudio,
  };
}
