import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, FileSpreadsheet, BarChart3, Download, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const activeJDs = [
  { company: "Google", role: "SDE Intern", students: 45, shortlisted: 12, status: "Ready" },
  { company: "Microsoft", role: "SWE Intern", students: 38, shortlisted: 0, status: "Pending" },
  { company: "Flipkart", role: "Backend Dev", students: 52, shortlisted: 15, status: "Ready" },
];

const shortlistResults = [
  { rank: 1, name: "Arjun Mehta", match: 94, cgpa: 9.1, reason: "Strong system design + relevant React experience" },
  { rank: 2, name: "Priya Sharma", match: 91, cgpa: 8.8, reason: "Excellent DSA scores + Python proficiency" },
  { rank: 3, name: "Rahul Gupta", match: 87, cgpa: 8.5, reason: "Good communication + relevant internship experience" },
  { rank: 4, name: "Sneha Patel", match: 84, cgpa: 9.3, reason: "High CGPA + solid fundamentals, needs project depth" },
  { rank: 5, name: "Vikram Singh", match: 80, cgpa: 8.2, reason: "Good practical skills + open source contributions" },
];

const OfficerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Placement Officer Dashboard</h1>
            <p className="text-muted-foreground">Manage JDs, view student performance, and generate AI shortlists.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Users, label: "Total Students", value: "135", color: "text-primary" },
              { icon: FileSpreadsheet, label: "Active JDs", value: "3", color: "text-accent" },
              { icon: BarChart3, label: "Avg Score", value: "76%", color: "text-success" },
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

          {/* Active JDs */}
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Active Job Descriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {activeJDs.map((jd, i) => (
              <motion.div
                key={jd.company}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-5 rounded-xl bg-card border border-border"
              >
                <h3 className="font-display font-semibold text-foreground">{jd.company}</h3>
                <p className="text-sm text-muted-foreground mb-3">{jd.role}</p>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{jd.students} students</span>
                  <span>{jd.shortlisted > 0 ? `${jd.shortlisted} shortlisted` : "Not generated"}</span>
                </div>
                <Progress value={(jd.shortlisted / jd.students) * 100} className="h-1.5 mb-4" />
                <div className="flex gap-2">
                  <Button variant="hero" size="sm" className="flex-1">
                    <Zap className="w-3 h-3 mr-1" /> Generate Shortlist
                  </Button>
                  {jd.shortlisted > 0 && (
                    <Button variant="hero-outline" size="sm">
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Shortlist Results */}
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Google — SDE Intern Shortlist
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-card border border-border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs text-muted-foreground uppercase tracking-wider">Rank</th>
                    <th className="text-left p-4 text-xs text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="text-left p-4 text-xs text-muted-foreground uppercase tracking-wider">Match</th>
                    <th className="text-left p-4 text-xs text-muted-foreground uppercase tracking-wider">CGPA</th>
                    <th className="text-left p-4 text-xs text-muted-foreground uppercase tracking-wider">AI Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlistResults.map((s) => (
                    <tr key={s.rank} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          s.rank <= 3 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          {s.rank}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-foreground">{s.name}</td>
                      <td className="p-4">
                        <span className="font-display font-bold text-success">{s.match}%</span>
                      </td>
                      <td className="p-4 text-foreground">{s.cgpa}</td>
                      <td className="p-4 text-sm text-muted-foreground">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <Button variant="hero" size="sm">
                <Download className="w-4 h-4 mr-1" /> Export as Excel
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
