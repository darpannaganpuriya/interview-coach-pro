import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, role, company } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const transcriptText = transcript
      .map((t: any) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.content}`)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert interview evaluator. Analyze the complete interview transcript for a ${role} position at ${company}. 
Evaluate the candidate's performance across multiple dimensions and provide detailed, actionable feedback.
Be honest but constructive. Score from 0-100.`,
          },
          {
            role: "user",
            content: `Evaluate this interview transcript:\n\n${transcriptText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_interview",
              description: "Return comprehensive interview evaluation",
              parameters: {
                type: "object",
                properties: {
                  overallScore: { type: "number", description: "Overall score 0-100" },
                  categories: {
                    type: "object",
                    properties: {
                      technicalAccuracy: { type: "number" },
                      communication: { type: "number" },
                      problemSolving: { type: "number" },
                      confidence: { type: "number" },
                      bodyLanguage: { type: "number" },
                    },
                    required: ["technicalAccuracy", "communication", "problemSolving", "confidence", "bodyLanguage"],
                  },
                  strengths: { type: "array", items: { type: "string" }, description: "3-5 key strengths" },
                  improvements: { type: "array", items: { type: "string" }, description: "3-5 areas to improve" },
                  questionBreakdown: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                        score: { type: "number" },
                        feedback: { type: "string" },
                      },
                      required: ["question", "answer", "score", "feedback"],
                    },
                  },
                  summary: { type: "string", description: "2-3 sentence overall summary" },
                },
                required: ["overallScore", "categories", "strengths", "improvements", "questionBreakdown", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "evaluate_interview" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const evaluation = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(evaluation), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error("No tool call in response");
  } catch (e) {
    console.error("transcript-evaluator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
