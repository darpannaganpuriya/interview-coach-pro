import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, FileText, Play, Clock, Target, TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSessions, type JDMatch, type InterviewSession } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    resumeData,
    jdMatches,
    uploadAndAnalyze,
    isAnalyzing,
    isMatching,
    isLoading: resumeLoading,
    error: resumeError,
  } = useResumeAnalysis();

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
      return;
    }
    try {
      await uploadAndAnalyze(file);
      toast({ title: "Resume analyzed!", description: "AI has matched you with relevant job descriptions." });
    } catch {
      toast({ title: "Analysis failed", description: "Could not analyze resume. Try again.", variant: "destructive" });
    }
  }, [uploadAndAnalyze, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Use API data if available, otherwise show empty state
  const displayMatches: JDMatch[] = jdMatches;
  const displaySessions: InterviewSession[] = sessions;

  // Stats from real data
  const totalSessions = displaySessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(displaySessions.reduce((sum, s) => sum + s.score, 0) / totalSessions)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome, {user?.name || "Student"} 👋
            </h1>
            <p className="text-muted-foreground">Upload your resume, match with JDs, and start practicing.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Target, label: "Sessions", value: String(totalSessions), color: "text-primary" },
              { icon: TrendingUp, label: "Avg Score", value: totalSessions > 0 ? `${avgScore}%` : "—", color: "text-success" },
              { icon: Clock, label: "JD Matches", value: String(displayMatches.length), color: "text-warning" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-card border border-border"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Resume Upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-xl border-2 border-dashed transition-colors mb-8 text-center cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {resumeLoading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-foreground font-medium mb-1">
                  {isAnalyzing ? "Analyzing resume with AI..." : "Matching with job descriptions..."}
                </p>
                <p className="text-sm text-muted-foreground">This may take a few seconds.</p>
              </>
            ) : resumeData ? (
              <>
                <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">Resume Analyzed ✓</p>
                <p className="text-sm text-muted-foreground">
                  Skills: {resumeData.skills.join(", ")} • Suggested: {resumeData.suggestedRoles.join(", ")}
                </p>
                <Button variant="hero" size="sm" className="mt-4" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <Upload className="w-4 h-4 mr-1" /> Upload New Resume
                </Button>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">Upload Your Resume</p>
                <p className="text-sm text-muted-foreground">Drag & drop or click • PDF format, max 5MB</p>
                <Button variant="hero" size="sm" className="mt-4">
                  <FileText className="w-4 h-4 mr-1" /> Choose File
                </Button>
              </>
            )}
          </motion.div>

          {/* Resume Summary */}
          {resumeData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl bg-card border border-border mb-8"
            >
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">AI Resume Summary</h2>
              <p className="text-sm text-muted-foreground mb-3">{resumeData.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {resumeData.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">{s}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* JD Matches */}
          {displayMatches.length > 0 && (
            <>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">JD Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {displayMatches.map((jd, i) => (
                  <motion.div
                    key={`${jd.company}-${jd.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{jd.company}</h3>
                        <p className="text-sm text-muted-foreground">{jd.role}</p>
                      </div>
                      <div className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                        jd.matchScore >= 85 ? "bg-success/10 text-success" :
                        jd.matchScore >= 70 ? "bg-primary/10 text-primary" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {jd.matchScore}%
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{jd.status}</div>
                    <p className="text-xs text-muted-foreground mb-2">{jd.reasoning}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {jd.matchedSkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-success/10 text-success">{s}</span>
                      ))}
                      {jd.missingSkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-warning/10 text-warning">{s}</span>
                      ))}
                    </div>
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/interview?company=${encodeURIComponent(jd.company)}&role=${encodeURIComponent(jd.role)}`)}
                    >
                      <Play className="w-3 h-3 mr-1" /> Start Interview
                    </Button>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Empty state for matches */}
          {!resumeData && displayMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Upload your resume to see AI-matched job descriptions</p>
            </div>
          )}

          {/* Past Sessions */}
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Past Sessions</h2>
          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : displaySessions.length > 0 ? (
            <div className="space-y-3">
              {displaySessions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{s.company} — {s.role}</p>
                    <p className="text-sm text-muted-foreground">{s.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display font-bold text-lg text-primary">{s.score}%</span>
                    <Button
                      variant="hero-outline"
                      size="sm"
                      onClick={() => navigate(`/report?session=${s.id}`)}
                    >
                      View Report
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No sessions yet. Start an interview to see your history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
