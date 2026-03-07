import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, FileText, Play, Clock, Target, TrendingUp } from "lucide-react";

const mockJDs = [
  { company: "Google", role: "SDE Intern", match: 92, status: "Best Match", skills: ["React", "DSA", "System Design"], missing: ["Go"] },
  { company: "Microsoft", role: "SWE Intern", match: 78, status: "Good Match", skills: ["Python", "SQL", "OOP"], missing: ["Azure", "C#"] },
  { company: "Flipkart", role: "Backend Dev", match: 65, status: "Also Consider", skills: ["Python", "SQL"], missing: ["Java", "Kafka"] },
];

const sessions = [
  { company: "Google", role: "SDE Intern", date: "Feb 28, 2026", score: 84, status: "Completed" },
  { company: "Amazon", role: "SDE-1", date: "Feb 25, 2026", score: 71, status: "Completed" },
];

const Dashboard = () => {
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
              { icon: Target, label: "Sessions", value: "5", color: "text-primary" },
              { icon: TrendingUp, label: "Avg Score", value: "78%", color: "text-success" },
              { icon: Clock, label: "Practice Time", value: "2.5 hrs", color: "text-warning" },
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
            className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors mb-8 text-center cursor-pointer"
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">Upload Your Resume</p>
            <p className="text-sm text-muted-foreground">PDF format, max 5MB. AI will match you with relevant JDs.</p>
            <Button variant="hero" size="sm" className="mt-4">
              <FileText className="w-4 h-4 mr-1" /> Choose File
            </Button>
          </motion.div>

          {/* JD Matches */}
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">JD Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {mockJDs.map((jd, i) => (
              <motion.div
                key={jd.company}
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
                    jd.match >= 85 ? "bg-success/10 text-success" : jd.match >= 70 ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                  }`}>
                    {jd.match}%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{jd.status}</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {jd.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-success/10 text-success">{s}</span>
                  ))}
                  {jd.missing.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-warning/10 text-warning">{s}</span>
                  ))}
                </div>
                <Button variant="hero" size="sm" className="w-full">
                  <Play className="w-3 h-3 mr-1" /> Start Interview
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Past Sessions */}
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Past Sessions</h2>
          <div className="space-y-3">
            {sessions.map((s, i) => (
              <motion.div
                key={i}
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
                  <Button variant="hero-outline" size="sm">View Report</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
