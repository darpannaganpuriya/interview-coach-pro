import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mic, MicOff, Camera, Phone, Clock, MessageSquare, Lightbulb, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TranscriptEntry {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
}

interface CoachingTip {
  tip: string;
  type: "success" | "warning" | "info";
}

const TOTAL_QUESTIONS = 12;

const InterviewRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [coachingTips, setCoachingTips] = useState<CoachingTip[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionData, setSessionData] = useState<{ company: string; role: string } | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load session data
  useEffect(() => {
    if (!sessionId || !user) return;
    const load = async () => {
      const { data } = await supabase
        .from("interview_sessions")
        .select("company, role, transcript, current_question_index")
        .eq("id", sessionId)
        .single();
      if (data) {
        setSessionData({ company: data.company, role: data.role });
        if (data.transcript && Array.isArray(data.transcript) && (data.transcript as any[]).length > 0) {
          setTranscript(data.transcript as unknown as TranscriptEntry[]);
          setCurrentQuestionIndex(data.current_question_index || 0);
        } else {
          // Start first question
          generateQuestion(0, [], data.company, data.role);
        }
      }
    };
    load();
  }, [sessionId, user]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        toast.error("Camera/mic access denied. You can still type answers.");
      }
    };
    startCamera();
    return () => { cameraStream?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const generateQuestion = async (index: number, currentTranscript: TranscriptEntry[], company: string, role: string, userAnswer?: string) => {
    setIsAiThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("interviewer", {
        body: {
          action: "generate_question",
          role,
          company,
          transcript: currentTranscript,
          currentQuestionIndex: index,
          totalQuestions: TOTAL_QUESTIONS,
          userAnswer,
        },
      });

      if (error) throw error;

      const entry: TranscriptEntry = {
        role: "interviewer",
        content: data.question,
        timestamp: Date.now(),
      };

      const newTranscript = [...currentTranscript, entry];
      setTranscript(newTranscript);
      setCurrentQuestionIndex(index + 1);

      // Save to DB
      if (sessionId) {
        await supabase
          .from("interview_sessions")
          .update({
            transcript: newTranscript as any,
            current_question_index: index + 1,
          })
          .eq("id", sessionId);
      }
    } catch (err: any) {
      toast.error("Failed to generate question: " + (err.message || "Unknown error"));
    } finally {
      setIsAiThinking(false);
    }
  };

  const getCoachingTip = async (answer: string) => {
    try {
      const { data } = await supabase.functions.invoke("interviewer", {
        body: { action: "get_coaching_tip", userAnswer: answer },
      });
      if (data) {
        setCoachingTips(prev => [...prev, data]);
      }
    } catch {
      // Silent fail for coaching tips
    }
  };

  // Speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscriptText = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptText += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
    };

    recognition.onend = () => {
      if (finalTranscriptText.trim() && !interviewEnded) {
        submitAnswer(finalTranscriptText.trim());
      }
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        toast.error("Speech recognition error: " + event.error);
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setIsMuted(false);
  }, [interviewEnded, transcript, sessionData, currentQuestionIndex]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsMuted(true);
  }, []);

  const submitAnswer = async (answerText: string) => {
    if (!sessionData || interviewEnded) return;

    const entry: TranscriptEntry = {
      role: "candidate",
      content: answerText,
      timestamp: Date.now(),
    };

    const newTranscript = [...transcript, entry];
    setTranscript(newTranscript);

    // Get coaching tip in background
    getCoachingTip(answerText);

    // Check if interview is done
    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
      await endInterview(newTranscript);
      return;
    }

    // Generate next question
    await generateQuestion(currentQuestionIndex, newTranscript, sessionData.company, sessionData.role, answerText);
  };

  const endInterview = async (finalTranscript?: TranscriptEntry[]) => {
    setInterviewEnded(true);
    stopListening();
    if (timerRef.current) clearInterval(timerRef.current);
    cameraStream?.getTracks().forEach(t => t.stop());

    const t = finalTranscript || transcript;

    if (sessionId) {
      await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          transcript: t as any,
          duration_seconds: timeElapsed,
        })
        .eq("id", sessionId);
    }

    toast.success("Interview completed! Generating your report...");

    // Call transcript evaluator
    try {
      const { data: evaluation, error } = await supabase.functions.invoke("transcript-evaluator", {
        body: {
          transcript: t,
          role: sessionData?.role || "Software Engineer",
          company: sessionData?.company || "Company",
        },
      });

      if (error) throw error;

      // Save report
      if (sessionId && user) {
        await supabase.from("reports").insert({
          user_id: user.id,
          session_id: sessionId,
          overall_score: evaluation.overallScore,
          categories: evaluation.categories as any,
          strengths: evaluation.strengths as any,
          improvements: evaluation.improvements as any,
          question_breakdown: evaluation.questionBreakdown as any,
          summary: evaluation.summary,
        });
      }

      navigate(`/report/${sessionId}`);
    } catch (err: any) {
      toast.error("Failed to generate report: " + (err.message || "Unknown error"));
      navigate(`/report/${sessionId}`);
    }
  };

  // Manual answer input
  const [manualAnswer, setManualAnswer] = useState("");
  const handleManualSubmit = () => {
    if (manualAnswer.trim()) {
      submitAnswer(manualAnswer.trim());
      setManualAnswer("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {sessionData ? `${sessionData.company} — ${sessionData.role}` : "Loading..."}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatTime(timeElapsed)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Q {Math.min(currentQuestionIndex, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</span>
            <Progress value={(currentQuestionIndex / TOTAL_QUESTIONS) * 100} className="w-24 h-2" />
            <Button variant="destructive" size="sm" onClick={() => endInterview()} disabled={interviewEnded}>
              <Phone className="w-3 h-3 mr-1" /> End Interview
            </Button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px_280px] overflow-hidden">
          {/* Transcript panel */}
          <div className="flex flex-col border-r border-border">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" /> Live Transcript
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
              {isAiThinking && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is thinking...
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-center gap-4 mb-3">
                <Button
                  variant={isMuted ? "destructive" : "hero"}
                  size="icon"
                  className="w-14 h-14 rounded-full"
                  onClick={() => isMuted ? startListening() : stopListening()}
                  disabled={isAiThinking || interviewEnded}
                >
                  {isRecording ? <Mic className="w-6 h-6 animate-pulse" /> : isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {isRecording ? "Listening... click to stop" : isMuted ? "Click mic to answer" : "Processing..."}
                </p>
              </div>
              {/* Manual text input fallback */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  placeholder="Or type your answer here..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={isAiThinking || interviewEnded}
                />
                <Button size="sm" variant="hero" onClick={handleManualSubmit} disabled={!manualAnswer.trim() || isAiThinking || interviewEnded}>
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* Camera panel */}
          <div className="hidden lg:flex flex-col border-r border-border">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <Camera className="w-4 h-4" /> Camera Feed
              </div>
            </div>
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex-1 rounded-lg bg-muted/30 border border-border overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <div className="font-display text-xl font-bold text-success">Q{currentQuestionIndex}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <div className="font-display text-xl font-bold text-primary">{TOTAL_QUESTIONS}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
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
              {coachingTips.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-8">Coaching tips will appear here after you answer questions.</p>
              )}
              {coachingTips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border text-sm ${
                    tip.type === "success" ? "bg-success/10 border-success/20 text-foreground" :
                    tip.type === "warning" ? "bg-warning/10 border-warning/20 text-foreground" :
                    "bg-primary/10 border-primary/20 text-foreground"
                  }`}
                >
                  {tip.type === "success" ? "✅ " : tip.type === "warning" ? "💡 " : "📊 "}
                  {tip.tip}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
