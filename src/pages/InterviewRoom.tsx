import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mic, MicOff, Camera, Phone, Clock, MessageSquare, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

const mockTranscript = [
  { role: "ai", text: "Tell me about yourself and what excites you about software development." },
  { role: "user", text: "Hi, I'm a final year CSE student. I've been passionate about building web applications, particularly with React and Node.js. My recent project was a real-time collaboration tool..." },
  { role: "ai", text: "That's interesting. Can you walk me through the architecture of that collaboration tool? What were the key technical decisions?" },
  { role: "user", text: "Sure, I used WebSockets for real-time sync and implemented CRDT-based conflict resolution..." },
];

const InterviewRoom = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [timeElapsed] = useState("12:34");
  const [questionCount] = useState(6);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Google — SDE Intern</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {timeElapsed}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Q {questionCount}/12</span>
            <Progress value={(questionCount / 12) * 100} className="w-24 h-2" />
            <Button variant="destructive" size="sm">
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
              {mockTranscript.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`p-4 rounded-lg ${
                    msg.role === "ai"
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-secondary"
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${msg.role === "ai" ? "text-primary" : "text-muted-foreground"}`}>
                    {msg.role === "ai" ? "AI Interviewer" : "You"}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                </motion.div>
              ))}
              {/* Typing indicator */}
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
                </div>
                AI is thinking...
              </div>
            </div>

            {/* Mic controls */}
            <div className="p-4 border-t border-border flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "hero"}
                size="icon"
                className="w-14 h-14 rounded-full"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isMuted ? "Microphone muted" : "Listening..."}
              </p>
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
              <div className="flex-1 rounded-lg bg-muted/30 border border-border flex items-center justify-center mb-4">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Camera preview</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <div className="font-display text-xl font-bold text-success">87%</div>
                  <div className="text-xs text-muted-foreground">Eye Contact</div>
                  <Progress value={87} className="h-1.5 mt-2" />
                </div>
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <div className="font-display text-xl font-bold text-primary">92%</div>
                  <div className="text-xs text-muted-foreground">Posture</div>
                  <Progress value={92} className="h-1.5 mt-2" />
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
              {[
                { type: "success", text: "Great depth in your architecture explanation" },
                { type: "warning", text: "Slow down slightly — you're speaking fast" },
                { type: "success", text: "Good use of specific metrics and numbers" },
                { type: "warning", text: "Try to mention the team size and your role" },
                { type: "info", text: "Filler words detected: 3 in last answer" },
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
