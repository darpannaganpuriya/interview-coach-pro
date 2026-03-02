import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

const overallScore = 82;

const scoreRings = [
  { name: "Technical", score: 85, fill: "hsl(190, 95%, 50%)" },
  { name: "Communication", score: 78, fill: "hsl(260, 70%, 60%)" },
  { name: "Body Language", score: 88, fill: "hsl(160, 70%, 45%)" },
];

const topicScores = [
  { topic: "React.js", score: 90 },
  { topic: "System Design", score: 75 },
  { topic: "DSA", score: 82 },
  { topic: "APIs", score: 88 },
  { topic: "Databases", score: 70 },
];

const radarData = [
  { subject: "Clarity", A: 85 },
  { subject: "Depth", A: 78 },
  { subject: "Confidence", A: 82 },
  { subject: "Pace", A: 75 },
  { subject: "Structure", A: 90 },
  { subject: "Examples", A: 88 },
];

const qaTranscript = [
  { q: "Tell me about yourself.", a: "I'm a final year CSE student passionate about full-stack development...", score: "Good" },
  { q: "Explain the architecture of your collaboration tool.", a: "I used WebSockets with CRDT-based conflict resolution, a Node.js backend with Redis pub/sub...", score: "Excellent" },
  { q: "How would you design a URL shortener?", a: "I'd use a hashing approach with base62 encoding, a relational DB for storage, and Redis for caching...", score: "Good" },
];

const tips = [
  "Practice system design questions — your depth was strong but needed more mention of trade-offs.",
  "Reduce filler words ('um', 'like') — detected 7 times in 22 minutes.",
  "When discussing projects, always mention the scale and impact metrics.",
];

const ScoreRing = ({ score, label, color }: { score: number; label: string; color: string }) => {
  const data = [{ name: label, value: score, fill: color }];
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32">
        <ResponsiveContainer>
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(222, 30%, 14%)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center -mt-3">
        <div className="font-display text-2xl font-bold text-foreground">{score}%</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
};

const Report = () => {
  const [expandedQ, setExpandedQ] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Interview Report</h1>
                <p className="text-muted-foreground">Google — SDE Intern • Feb 28, 2026 • 22 minutes</p>
              </div>
              <Button variant="hero-outline" size="sm">
                <Download className="w-4 h-4 mr-1" /> Export PDF
              </Button>
            </div>
          </motion.div>

          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-xl bg-card border border-border mb-8 text-center"
          >
            <div className="font-display text-6xl font-bold text-gradient mb-2">{overallScore}%</div>
            <p className="text-muted-foreground">Overall Interview Score</p>
          </motion.div>

          {/* Score Rings */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {scoreRings.map((ring, i) => (
              <motion.div
                key={ring.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border flex justify-center"
              >
                <ScoreRing score={ring.score} label={ring.name} color={ring.fill} />
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl bg-card border border-border"
            >
              <h3 className="font-display font-semibold mb-4 text-foreground">Topic Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="topic" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "hsl(222, 44%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: 8 }} />
                  <Bar dataKey="score" fill="hsl(190, 95%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl bg-card border border-border"
            >
              <h3 className="font-display font-semibold mb-4 text-foreground">Communication Radar</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(222, 30%, 18%)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  <Radar dataKey="A" stroke="hsl(260, 70%, 60%)" fill="hsl(260, 70%, 60%)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Improvement Tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-xl bg-card border border-border mb-8"
          >
            <h3 className="font-display font-semibold mb-4 text-foreground">Improvement Tips</h3>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  <p className="text-sm text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Q&A Transcript */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-6 rounded-xl bg-card border border-border"
          >
            <h3 className="font-display font-semibold mb-4 text-foreground">Q&A Transcript</h3>
            <div className="space-y-3">
              {qaTranscript.map((item, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                      <span className="text-sm text-foreground">{item.q}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.score === "Excellent" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      }`}>
                        {item.score}
                      </span>
                      {expandedQ === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expandedQ === i && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Report;
