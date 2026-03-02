/**
 * PlacePrep AI — API Service Layer
 * 
 * This module defines all API calls to the FastAPI/LangChain backend.
 * Replace BASE_URL with your deployed backend URL.
 * 
 * All functions currently return mock data for development.
 * Swap the mock implementations with real fetch calls when your backend is ready.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResumeAnalysis {
  skills: string[];
  experience: { title: string; company: string; duration: string }[];
  education: { degree: string; institution: string; cgpa: number }[];
  suggestedRoles: string[];
  summary: string;
}

export interface JDMatch {
  company: string;
  role: string;
  matchScore: number;
  status: "Best Match" | "Good Match" | "Also Consider";
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export interface TranscriptMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
}

export interface TranscriptAnalysis {
  overallScore: number;
  categories: {
    technicalAccuracy: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    bodyLanguage: number;
  };
  strengths: string[];
  improvements: string[];
  questionBreakdown: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
  summary: string;
}

export interface ShortlistCandidate {
  rank: number;
  name: string;
  matchScore: number;
  cgpa: number;
  reasoning: string;
  interviewScore?: number;
}

export interface InterviewSession {
  id: string;
  company: string;
  role: string;
  date: string;
  score: number;
  status: "Completed" | "In Progress" | "Scheduled";
}

// ─── API Client Helper ───────────────────────────────────────────────────────

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Add auth token when available:
    // "Authorization": `Bearer ${getAuthToken()}`,
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// ─── Resume Agent APIs ───────────────────────────────────────────────────────

/**
 * Upload and analyze a resume using the LangChain Resume Agent.
 * POST /api/v1/resume/analyze
 */
export async function analyzeResume(file: File): Promise<ResumeAnalysis> {
  const formData = new FormData();
  formData.append("resume", file);

  // TODO: Replace with real API call when backend is ready
  // return apiCall<ResumeAnalysis>("/resume/analyze", {
  //   method: "POST",
  //   headers: {}, // Let browser set Content-Type for FormData
  //   body: formData,
  // });

  // Mock response for development
  await new Promise((r) => setTimeout(r, 1500));
  return {
    skills: ["React", "Python", "SQL", "DSA", "System Design", "TypeScript"],
    experience: [
      { title: "Frontend Intern", company: "TechCorp", duration: "3 months" },
    ],
    education: [
      { degree: "B.Tech CSE", institution: "IIT Delhi", cgpa: 8.7 },
    ],
    suggestedRoles: ["SDE Intern", "Frontend Developer", "Full Stack Developer"],
    summary:
      "Strong frontend skills with React and TypeScript. Solid DSA fundamentals. Could improve backend and cloud experience.",
  };
}

/**
 * Match a resume against available job descriptions.
 * POST /api/v1/resume/match-jds
 */
export async function matchResumeWithJDs(resumeId: string): Promise<JDMatch[]> {
  // TODO: Replace with real API call
  // return apiCall<JDMatch[]>("/resume/match-jds", {
  //   method: "POST",
  //   body: JSON.stringify({ resumeId }),
  // });

  await new Promise((r) => setTimeout(r, 1000));
  return [
    {
      company: "Google",
      role: "SDE Intern",
      matchScore: 92,
      status: "Best Match",
      matchedSkills: ["React", "DSA", "System Design"],
      missingSkills: ["Go"],
      reasoning: "Strong DSA and frontend skills align well with the role requirements.",
    },
    {
      company: "Microsoft",
      role: "SWE Intern",
      matchScore: 78,
      status: "Good Match",
      matchedSkills: ["Python", "SQL", "TypeScript"],
      missingSkills: ["Azure", "C#"],
      reasoning: "Good programming fundamentals, but missing Azure cloud experience.",
    },
    {
      company: "Flipkart",
      role: "Backend Dev",
      matchScore: 65,
      status: "Also Consider",
      matchedSkills: ["Python", "SQL"],
      missingSkills: ["Java", "Kafka"],
      reasoning: "Basic backend skills present but needs Java and distributed systems knowledge.",
    },
  ];
}

// ─── Interview Agent APIs ────────────────────────────────────────────────────

/**
 * Start a new interview session via WebSocket.
 * Returns the WebSocket URL to connect to.
 */
export function getInterviewWebSocketURL(sessionId: string): string {
  const wsBase = BASE_URL.replace(/^http/, "ws").replace("/api/v1", "");
  return `${wsBase}/ws/interview/${sessionId}`;
}

/**
 * Create a new interview session.
 * POST /api/v1/interview/start
 */
export async function startInterview(jdId: string, resumeId: string): Promise<{ sessionId: string }> {
  // TODO: Replace with real API call
  // return apiCall<{ sessionId: string }>("/interview/start", {
  //   method: "POST",
  //   body: JSON.stringify({ jdId, resumeId }),
  // });

  await new Promise((r) => setTimeout(r, 500));
  return { sessionId: `session_${Date.now()}` };
}

/**
 * End an interview session.
 * POST /api/v1/interview/:sessionId/end
 */
export async function endInterview(sessionId: string): Promise<void> {
  // TODO: Replace with real API call
  // return apiCall<void>(`/interview/${sessionId}/end`, { method: "POST" });

  await new Promise((r) => setTimeout(r, 300));
}

// ─── Evaluation Agent APIs ───────────────────────────────────────────────────

/**
 * Analyze an interview transcript using the LangChain Evaluation Agent.
 * POST /api/v1/evaluation/analyze
 */
export async function analyzeTranscript(sessionId: string): Promise<TranscriptAnalysis> {
  // TODO: Replace with real API call
  // return apiCall<TranscriptAnalysis>("/evaluation/analyze", {
  //   method: "POST",
  //   body: JSON.stringify({ sessionId }),
  // });

  await new Promise((r) => setTimeout(r, 2000));
  return {
    overallScore: 84,
    categories: {
      technicalAccuracy: 88,
      communication: 82,
      problemSolving: 85,
      confidence: 79,
      bodyLanguage: 76,
    },
    strengths: [
      "Clear explanation of data structure choices",
      "Good problem decomposition approach",
      "Strong React fundamentals",
    ],
    improvements: [
      "Could elaborate more on time complexity analysis",
      "Eye contact dropped during difficult questions",
      "Consider structuring answers using STAR method",
    ],
    questionBreakdown: [
      {
        question: "Explain how you would design a URL shortener",
        answer: "I would use a hash-based approach with a NoSQL database...",
        score: 90,
        feedback: "Excellent system design thinking. Consider mentioning caching strategies.",
      },
      {
        question: "What is the time complexity of quicksort?",
        answer: "Average case O(n log n), worst case O(n²)...",
        score: 85,
        feedback: "Correct answer. Could have discussed pivot selection strategies.",
      },
    ],
    summary:
      "Strong technical candidate with good communication skills. Recommend focusing on system design depth and maintaining composure under pressure.",
  };
}

// ─── Shortlist APIs (Officer) ────────────────────────────────────────────────

/**
 * Generate AI-powered shortlist for a JD.
 * POST /api/v1/shortlist/generate
 */
export async function generateShortlist(jdId: string): Promise<ShortlistCandidate[]> {
  // TODO: Replace with real API call
  // return apiCall<ShortlistCandidate[]>("/shortlist/generate", {
  //   method: "POST",
  //   body: JSON.stringify({ jdId }),
  // });

  await new Promise((r) => setTimeout(r, 2500));
  return [
    { rank: 1, name: "Arjun Mehta", matchScore: 94, cgpa: 9.1, reasoning: "Strong system design + relevant React experience", interviewScore: 88 },
    { rank: 2, name: "Priya Sharma", matchScore: 91, cgpa: 8.8, reasoning: "Excellent DSA scores + Python proficiency", interviewScore: 85 },
    { rank: 3, name: "Rahul Gupta", matchScore: 87, cgpa: 8.5, reasoning: "Good communication + relevant internship experience", interviewScore: 82 },
    { rank: 4, name: "Sneha Patel", matchScore: 84, cgpa: 9.3, reasoning: "High CGPA + solid fundamentals, needs project depth", interviewScore: 79 },
    { rank: 5, name: "Vikram Singh", matchScore: 80, cgpa: 8.2, reasoning: "Good practical skills + open source contributions", interviewScore: 76 },
  ];
}

// ─── Session History APIs ────────────────────────────────────────────────────

/**
 * Fetch past interview sessions for the logged-in student.
 * GET /api/v1/sessions
 */
export async function fetchSessions(): Promise<InterviewSession[]> {
  // TODO: Replace with real API call
  // return apiCall<InterviewSession[]>("/sessions");

  await new Promise((r) => setTimeout(r, 500));
  return [
    { id: "s1", company: "Google", role: "SDE Intern", date: "Feb 28, 2026", score: 84, status: "Completed" },
    { id: "s2", company: "Amazon", role: "SDE-1", date: "Feb 25, 2026", score: 71, status: "Completed" },
  ];
}
