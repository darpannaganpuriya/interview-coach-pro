import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mic, MicOff, Camera, Phone, Clock, MessageSquare, Lightbulb, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useInterview } from "@/hooks/useInterview";
import { useToast } from "@/hooks/use-toast";

const InterviewRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const company = searchParams.get("company") || "Company";
  const role = searchParams.get("role") || "Role";

  const {
    isConnected,
    isStarting,
    transcript,
    sessionId,
    start,
    stop,
    sendAudio,
  } = useInterview();

  const [isMuted, setIsMuted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (hasStarted && isConnected) {
      timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [hasStarted, isConnected]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startInterview = useCallback(async () => {
    try {
      // Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start session
      await start("jd_mock", "resume_mock");
      setHasStarted(true);

      // Set up audio recording
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && !isMuted) {
          sendAudio(event.data);
        }
      };

      mediaRecorder.start(1000); // Send audio chunks every second
      toast({ title: "Interview started", description: `${company} — ${role}` });
    } catch (err: any) {
      toast({
        title: "Could not start",
        description: err.message?.includes("Permission") ? "Microphone access required." : "Failed to connect.",
        variant: "destructive",
      });
    }
  }, [start, sendAudio, isMuted, company, role, toast]);

  const endInterview = useCallback(async () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await stop();
    clearInterval(timerRef.current);
    toast({ title: "Interview ended", description: "Generating your report..." });
    // Navigate to report
    if (sessionId) {
      navigate(`/report?session=${sessionId}`);
    }
  }, [stop, sessionId, navigate, toast]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted; // Toggle (current state is about to flip)
      });
    }
  }, [isMuted]);

  const questionCount = transcript.filter((t) => t.role === "interviewer").length;

  // Pre-start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Ready for your interview?</h1>
            <p className="text-muted-foreground mb-2">{company} — {role}</p>
            <p className="text-sm text-muted-foreground mb-6">
              Make sure your microphone is working. The AI interviewer will ask questions based on the job description.
            </p>
            <Button variant="hero" size="lg" onClick={startInterview} disabled={isStarting}>
              {isStarting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
              ) : (
                <><Mic className="w-5 h-5 mr-2" /> Start Interview</>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{company} — {role}</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatTime(timeElapsed)}
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${isConnected ? "text-success" : "text-destructive"}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-success" : "bg-destructive"}`} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Q {questionCount}</span>
            <Button variant="destructive" size="sm" onClick={endInterview}>
              <Phone className="w-3 h-3 mr-1" /> End Interview
            </Button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden">
          {/* Transcript panel */}
          <div className="flex flex-col border-r border-border">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" /> Live Transcript
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {transcript.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Waiting for the interviewer to begin...</p>
                </div>
              )}
              {transcript.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    msg.role === "interviewer"
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-secondary"
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${msg.role === "interviewer" ? "text-primary" : "text-muted-foreground"}`}>
                    {msg.role === "interviewer" ? "AI Interviewer" : "You"}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                </motion.div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Mic controls */}
            <div className="p-4 border-t border-border flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "hero"}
                size="icon"
                className="w-14 h-14 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isMuted ? "Microphone muted" : "Listening..."}
              </p>
            </div>
          </div>

          {/* Coaching panel */}
          <div className="hidden lg:flex flex-col">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" /> Live Coaching
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {transcript.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Tips will appear as you speak...
                </div>
              ) : (
                [
                  { type: "success", text: "Good depth in your answer" },
                  { type: "warning", text: "Try to slow down slightly" },
                  { type: "info", text: "Mention specific metrics" },
                ].map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-3 rounded-lg border text-sm ${
                      tip.type === "success" ? "bg-success/10 border-success/20 text-foreground" :
                      tip.type === "warning" ? "bg-warning/10 border-warning/20 text-foreground" :
                      "bg-primary/10 border-primary/20 text-foreground"
                    }`}
                  >
                    {tip.type === "success" ? "✅ " : tip.type === "warning" ? "💡 " : "📊 "}
                    {tip.text}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
