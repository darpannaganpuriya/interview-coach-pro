import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranscriptAnalysis } from "@/hooks/useTranscriptAnalysis";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

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
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session") || "default";
  const [expandedQ, setExpandedQ] = useState<number | null>(0);

  const { analysis, analyze, isLoading: isAnalyzing, error } = useTranscriptAnalysis();

  // Auto-trigger analysis on mount
  useEffect(() => {
    analyze(sessionId);
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadPDF = () => {
    // TODO: Call backend PDF generation endpoint
    // For now, use browser print
    window.print();
  };

  if (isAnalyzing || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Analyzing your interview...</h2>
            <p className="text-muted-foreground text-sm">Our AI agent is evaluating your performance</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load report</p>
            <Button variant="hero" onClick={() => analyze(sessionId)}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const scoreRings = [
    { name: "Technical", score: analysis.categories.technicalAccuracy, fill: "hsl(190, 95%, 50%)" },
    { name: "Communication", score: analysis.categories.communication, fill: "hsl(260, 70%, 60%)" },
    { name: "Confidence", score: analysis.categories.confidence, fill: "hsl(160, 70%, 45%)" },
  ];

  const radarData = [
    { subject: "Technical", A: analysis.categories.technicalAccuracy },
    { subject: "Communication", A: analysis.categories.communication },
    { subject: "Problem Solving", A: analysis.categories.problemSolving },
    { subject: "Confidence", A: analysis.categories.confidence },
    { subject: "Body Language", A: analysis.categories.bodyLanguage },
  ];

  const topicScores = analysis.questionBreakdown.map((q, i) => ({
    topic: `Q${i + 1}`,
    score: q.score,
  }));

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Interview Report</h1>
                <p className="text-muted-foreground">Session: {sessionId}</p>
              </div>
              <Button variant="hero-outline" size="sm" onClick={handleDownloadPDF}>
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
            <div className="font-display text-6xl font-bold text-gradient mb-2">{analysis.overallScore}%</div>
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
              <h3 className="font-display font-semibold mb-4 text-foreground">Question Scores</h3>
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
              <h3 className="font-display font-semibold mb-4 text-foreground">Skills Radar</h3>
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

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-display font-semibold mb-3 text-success">✅ Strengths</h3>
              <ul className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-success">•</span> {s}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-display font-semibold mb-3 text-warning">💡 Areas to Improve</h3>
              <ul className="space-y-2">
                {analysis.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-warning">•</span> {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* AI Summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="p-6 rounded-xl bg-card border border-border mb-8">
            <h3 className="font-display font-semibold mb-3 text-foreground">AI Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
          </motion.div>

          {/* Q&A Breakdown */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display font-semibold mb-4 text-foreground">Q&A Breakdown</h3>
            <div className="space-y-3">
              {analysis.questionBreakdown.map((item, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                      <span className="text-sm text-foreground truncate">{item.question}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.score >= 85 ? "bg-success/10 text-success" :
                        item.score >= 70 ? "bg-primary/10 text-primary" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {item.score}%
                      </span>
                      {expandedQ === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expandedQ === i && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                      <p className="text-sm text-foreground"><strong>Your answer:</strong> {item.answer}</p>
                      <p className="text-sm text-muted-foreground"><strong>Feedback:</strong> {item.feedback}</p>
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
