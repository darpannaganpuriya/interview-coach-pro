import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

interface ReportData {
  overall_score: number;
  categories: {
    technicalAccuracy: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    bodyLanguage: number;
  };
  strengths: string[];
  improvements: string[];
  question_breakdown: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
  summary: string;
}

interface SessionInfo {
  company: string;
  role: string;
  duration_seconds: number;
  created_at: string;
}

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
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(0);

  useEffect(() => {
    if (!sessionId || !user) return;
    const load = async () => {
      const { data: rep } = await supabase
        .from("reports")
        .select("overall_score, categories, strengths, improvements, question_breakdown, summary")
        .eq("session_id", sessionId)
        .single();

      const { data: sess } = await supabase
        .from("interview_sessions")
        .select("company, role, duration_seconds, created_at")
        .eq("id", sessionId)
        .single();

      if (rep) {
        setReport({
          overall_score: rep.overall_score || 0,
          categories: rep.categories as any,
          strengths: rep.strengths as any || [],
          improvements: rep.improvements as any || [],
          question_breakdown: rep.question_breakdown as any || [],
          summary: rep.summary || "",
        });
      }
      if (sess) setSessionInfo(sess);
      setLoading(false);
    };
    load();
  }, [sessionId, user]);

  const downloadReport = () => {
    if (!report || !sessionInfo) return;
    const content = `
INTERVIEW REPORT
================
${sessionInfo.company} — ${sessionInfo.role}
Date: ${new Date(sessionInfo.created_at).toLocaleDateString()}
Duration: ${Math.floor((sessionInfo.duration_seconds || 0) / 60)} minutes

OVERALL SCORE: ${report.overall_score}%

CATEGORY SCORES:
- Technical Accuracy: ${report.categories?.technicalAccuracy || 0}%
- Communication: ${report.categories?.communication || 0}%
- Problem Solving: ${report.categories?.problemSolving || 0}%
- Confidence: ${report.categories?.confidence || 0}%
- Body Language: ${report.categories?.bodyLanguage || 0}%

STRENGTHS:
${report.strengths.map(s => `• ${s}`).join("\n")}

AREAS FOR IMPROVEMENT:
${report.improvements.map(s => `• ${s}`).join("\n")}

Q&A BREAKDOWN:
${report.question_breakdown.map((q, i) => `
Q${i + 1}: ${q.question}
A: ${q.answer}
Score: ${q.score}%
Feedback: ${q.feedback}
`).join("\n")}

SUMMARY:
${report.summary}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-report-${sessionInfo.company}-${sessionInfo.role}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Report not ready yet. The AI may still be evaluating.</p>
            <Button variant="hero" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const scoreRings = [
    { name: "Technical", score: report.categories?.technicalAccuracy || 0, fill: "hsl(190, 95%, 50%)" },
    { name: "Communication", score: report.categories?.communication || 0, fill: "hsl(260, 70%, 60%)" },
    { name: "Problem Solving", score: report.categories?.problemSolving || 0, fill: "hsl(160, 70%, 45%)" },
  ];

  const radarData = [
    { subject: "Technical", A: report.categories?.technicalAccuracy || 0 },
    { subject: "Communication", A: report.categories?.communication || 0 },
    { subject: "Problem Solving", A: report.categories?.problemSolving || 0 },
    { subject: "Confidence", A: report.categories?.confidence || 0 },
    { subject: "Body Language", A: report.categories?.bodyLanguage || 0 },
  ];

  const topicScores = report.question_breakdown.slice(0, 6).map((q, i) => ({
    topic: `Q${i + 1}`,
    score: q.score,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Interview Report</h1>
                <p className="text-muted-foreground">
                  {sessionInfo?.company} — {sessionInfo?.role} • {sessionInfo ? new Date(sessionInfo.created_at).toLocaleDateString() : ""} • {sessionInfo ? Math.floor((sessionInfo.duration_seconds || 0) / 60) : 0} minutes
                </p>
              </div>
              <Button variant="hero-outline" size="sm" onClick={downloadReport}>
                <Download className="w-4 h-4 mr-1" /> Download Report
              </Button>
            </div>
          </motion.div>

          {/* Overall Score */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-xl bg-card border border-border mb-8 text-center">
            <div className="font-display text-6xl font-bold text-gradient mb-2">{report.overall_score}%</div>
            <p className="text-muted-foreground">Overall Interview Score</p>
          </motion.div>

          {/* Score Rings */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {scoreRings.map((ring, i) => (
              <motion.div key={ring.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="p-6 rounded-xl bg-card border border-border flex justify-center">
                <ScoreRing score={ring.score} label={ring.name} color={ring.fill} />
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-6 rounded-xl bg-card border border-border">
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

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="p-6 rounded-xl bg-card border border-border">
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

          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="p-6 rounded-xl bg-card border border-border mb-8">
            <h3 className="font-display font-semibold mb-2 text-foreground">Summary</h3>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
          </motion.div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-display font-semibold mb-4 text-foreground">💪 Strengths</h3>
              <div className="space-y-2">
                {report.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-success/5 border border-success/10">
                    <span className="text-success">✓</span>
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-display font-semibold mb-4 text-foreground">📈 Areas to Improve</h3>
              <div className="space-y-2">
                {report.improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-warning/5 border border-warning/10">
                    <span className="text-warning">→</span>
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Q&A Transcript */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display font-semibold mb-4 text-foreground">Q&A Breakdown</h3>
            <div className="space-y-3">
              {report.question_breakdown.map((item, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                      <span className="text-sm text-foreground">{item.question}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.score >= 80 ? "bg-success/10 text-success" : item.score >= 60 ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
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
