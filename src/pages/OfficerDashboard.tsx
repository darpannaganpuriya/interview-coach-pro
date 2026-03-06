import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, FileSpreadsheet, BarChart3, Download, Zap, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useShortlist } from "@/hooks/useShortlist";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const activeJDs = [
  { id: "jd_1", company: "Google", role: "SDE Intern", students: 45, shortlisted: 0, status: "Pending" },
  { id: "jd_2", company: "Microsoft", role: "SWE Intern", students: 38, shortlisted: 0, status: "Pending" },
  { id: "jd_3", company: "Flipkart", role: "Backend Dev", students: 52, shortlisted: 0, status: "Pending" },
];

const OfficerDashboard = () => {
  const { toast } = useToast();
  const { candidates: shortlist, generate, isLoading: isGenerating } = useShortlist();
  const [activeJdId, setActiveJdId] = useState<string | null>(null);

  const handleGenerate = async (jdId: string, company: string) => {
    setActiveJdId(jdId);
    try {
      await generate(jdId);
      toast({ title: "Shortlist generated!", description: `AI shortlist ready for ${company}` });
    } catch {
      toast({ title: "Failed", description: "Could not generate shortlist.", variant: "destructive" });
    }
  };

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
              { icon: FileSpreadsheet, label: "Active JDs", value: String(activeJDs.length), color: "text-accent" },
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
            {activeJDs.map((jd, i) => {
              const hasShortlist = activeJdId === jd.id && shortlist.length > 0;
              return (
                <motion.div
                  key={jd.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-5 rounded-xl bg-card border border-border"
                >
                  <h3 className="font-display font-semibold text-foreground">{jd.company}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{jd.role}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{jd.students} students</span>
                    <span>{hasShortlist ? `${shortlist.length} shortlisted` : "Not generated"}</span>
                  </div>
                  <Progress value={hasShortlist ? (shortlist.length / jd.students) * 100 : 0} className="h-1.5 mb-4" />
                  <div className="flex gap-2">
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1"
                      disabled={isGenerating && activeJdId === jd.id}
                      onClick={() => handleGenerate(jd.id, jd.company)}
                    >
                      {isGenerating && activeJdId === jd.id ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                      ) : (
                        <><Zap className="w-3 h-3 mr-1" /> Generate Shortlist</>
                      )}
                    </Button>
                    {hasShortlist && (
                      <Button variant="hero-outline" size="sm">
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Shortlist Results */}
          {shortlist.length > 0 && (
            <>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                AI-Generated Shortlist
              </h2>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                        <th className="text-left p-4 text-xs text-muted-foreground uppercase tracking-wider">Interview</th>
                        <th className="text-left p-4 text-xs text-muted-foreground uppercase tracking-wider">AI Reasoning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortlist.map((s) => (
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
                            <span className="font-display font-bold text-success">{s.matchScore}%</span>
                          </td>
                          <td className="p-4 text-foreground">{s.cgpa}</td>
                          <td className="p-4">
                            <span className="font-display font-bold text-primary">{s.interviewScore ?? "—"}%</span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{s.reasoning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-border flex justify-end">
                  <Button variant="hero" size="sm" onClick={() => window.print()}>
                    <Download className="w-4 h-4 mr-1" /> Export as Excel
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
