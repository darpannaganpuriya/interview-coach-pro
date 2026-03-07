import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, FileText, Play, Clock, Target, TrendingUp, Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ResumeAnalysis {
  skills: string[];
  experience: { title: string; company: string; duration: string }[];
  education: { degree: string; institution: string; cgpa: number }[];
  suggestedRoles: string[];
  summary: string;
}

interface JDMatch {
  company: string;
  role: string;
  matchScore: number;
  status: string;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

interface PastSession {
  id: string;
  company: string;
  role: string;
  created_at: string;
  status: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [jdMatches, setJdMatches] = useState<JDMatch[]>([]);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [reports, setReports] = useState<Record<string, number>>({});

  // Load past sessions and reports
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: sessions } = await supabase
        .from("interview_sessions")
        .select("id, company, role, created_at, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (sessions) setPastSessions(sessions);

      const { data: reps } = await supabase
        .from("reports")
        .select("session_id, overall_score")
        .eq("user_id", user.id);
      if (reps) {
        const map: Record<string, number> = {};
        reps.forEach((r: any) => { map[r.session_id] = r.overall_score; });
        setReports(map);
      }

      // Load latest resume analysis
      const { data: resumes } = await supabase
        .from("resumes")
        .select("analysis, jd_matches")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (resumes && resumes.length > 0) {
        if (resumes[0].analysis) setResumeAnalysis(resumes[0].analysis as unknown as ResumeAnalysis);
        if (resumes[0].jd_matches) setJdMatches(resumes[0].jd_matches as unknown as JDMatch[]);
      }
    };
    load();
  }, [user]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file);
      if (uploadError) throw uploadError;

      // Read file text for analysis
      const text = await file.text();

      setAnalyzing(true);
      toast.info("Analyzing your resume with AI...");

      // Call resume-analyzer edge function
      const { data: analysis, error: analysisError } = await supabase.functions.invoke("resume-analyzer", {
        body: { resumeText: text, action: "analyze" },
      });
      if (analysisError) throw analysisError;

      setResumeAnalysis(analysis);
      toast.success("Resume analyzed! Finding matching JDs...");

      // Get JD matches
      const { data: matches, error: matchError } = await supabase.functions.invoke("resume-analyzer", {
        body: { resumeText: text, action: "match_jds", skills: analysis.skills, suggestedRoles: analysis.suggestedRoles },
      });
      if (matchError) throw matchError;

      setJdMatches(matches);

      // Save to DB
      await supabase.from("resumes").insert({
        user_id: user.id,
        file_url: filePath,
        file_name: file.name,
        analysis: analysis as any,
        jd_matches: matches as any,
      });

      toast.success("JD matches found!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }, [user]);

  const startInterview = async (jd: JDMatch) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("interview_sessions").insert({
        user_id: user.id,
        company: jd.company,
        role: jd.role,
        status: "in_progress",
      }).select("id").single();

      if (error) throw error;
      navigate(`/interview/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start interview");
    }
  };

  const completedSessions = pastSessions.filter(s => s.status === "completed");
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (reports[s.id] || 0), 0) / completedSessions.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Student Dashboard</h1>
            <p className="text-muted-foreground">Upload your resume, match with JDs, and start practicing.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Target, label: "Sessions", value: String(pastSessions.length), color: "text-primary" },
              { icon: TrendingUp, label: "Avg Score", value: avgScore > 0 ? `${avgScore}%` : "—", color: "text-success" },
              { icon: Clock, label: "Skills Found", value: resumeAnalysis ? String(resumeAnalysis.skills.length) : "—", color: "text-warning" },
            ].map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-card border border-border">
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
            className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors mb-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileUpload} />
            {uploading || analyzing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-foreground font-medium">{uploading ? "Uploading..." : "AI is analyzing your resume..."}</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">Upload Your Resume</p>
                <p className="text-sm text-muted-foreground">PDF or text format. AI will analyze and match with relevant JDs.</p>
                <Button variant="hero" size="sm" className="mt-4">
                  <FileText className="w-4 h-4 mr-1" /> Choose File
                </Button>
              </>
            )}
          </motion.div>

          {/* Resume Analysis */}
          {resumeAnalysis && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl bg-card border border-border mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Resume Analysis</h2>
              <p className="text-sm text-muted-foreground mb-4">{resumeAnalysis.summary}</p>
              <div className="mb-3">
                <h3 className="text-sm font-medium text-foreground mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {resumeAnalysis.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Suggested Roles</h3>
                <div className="flex flex-wrap gap-1.5">
                  {resumeAnalysis.suggestedRoles.map((r) => (
                    <span key={r} className="px-2 py-0.5 text-xs rounded-md bg-success/10 text-success">{r}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* JD Matches */}
          {jdMatches.length > 0 && (
            <>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">JD Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {jdMatches.map((jd, i) => (
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
                        jd.matchScore >= 85 ? "bg-success/10 text-success" : jd.matchScore >= 70 ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                      }`}>
                        {jd.matchScore}%
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{jd.status}</div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {jd.matchedSkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-success/10 text-success">{s}</span>
                      ))}
                      {jd.missingSkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-warning/10 text-warning">{s}</span>
                      ))}
                    </div>
                    <Button variant="hero" size="sm" className="w-full" onClick={() => startInterview(jd)}>
                      <Play className="w-3 h-3 mr-1" /> Start Interview
                    </Button>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Past Sessions</h2>
              <div className="space-y-3">
                {pastSessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.company} — {s.role}</p>
                      <p className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {reports[s.id] ? (
                        <span className="font-display font-bold text-lg text-primary">{reports[s.id]}%</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{s.status === "in_progress" ? "In Progress" : "No Report"}</span>
                      )}
                      {s.status === "completed" && (
                        <Button variant="hero-outline" size="sm" onClick={() => navigate(`/report/${s.id}`)}>View Report</Button>
                      )}
                      {s.status === "in_progress" && (
                        <Button variant="hero" size="sm" onClick={() => navigate(`/interview/${s.id}`)}>Continue</Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
