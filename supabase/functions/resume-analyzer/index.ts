import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (action === "analyze") {
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
              content: `You are a resume analysis AI agent. Analyze the resume and extract structured data. Return a JSON object with tool calling.`,
            },
            {
              role: "user",
              content: `Analyze this resume:\n\n${resumeText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_resume",
                description: "Return structured resume analysis",
                parameters: {
                  type: "object",
                  properties: {
                    skills: { type: "array", items: { type: "string" }, description: "Technical and soft skills" },
                    experience: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          company: { type: "string" },
                          duration: { type: "string" },
                        },
                        required: ["title", "company", "duration"],
                      },
                    },
                    education: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          degree: { type: "string" },
                          institution: { type: "string" },
                          cgpa: { type: "number" },
                        },
                        required: ["degree", "institution", "cgpa"],
                      },
                    },
                    suggestedRoles: { type: "array", items: { type: "string" }, description: "3-5 job roles this candidate is best suited for" },
                    summary: { type: "string", description: "2-3 sentence summary of the candidate" },
                  },
                  required: ["skills", "experience", "education", "suggestedRoles", "summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "analyze_resume" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const analysis = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(analysis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("No tool call in response");
    }

    if (action === "match_jds") {
      const { skills, suggestedRoles } = await req.json().catch(() => ({ skills: resumeText, suggestedRoles: [] }));

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
              content: `You are a JD matching agent. Given candidate skills and suggested roles, generate 3 realistic job matches with companies, match scores, and reasoning.`,
            },
            {
              role: "user",
              content: `Skills: ${JSON.stringify(skills)}\nSuggested Roles: ${JSON.stringify(suggestedRoles)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "match_jds",
                description: "Return JD matches",
                parameters: {
                  type: "object",
                  properties: {
                    matches: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          company: { type: "string" },
                          role: { type: "string" },
                          matchScore: { type: "number" },
                          status: { type: "string", enum: ["Best Match", "Good Match", "Also Consider"] },
                          matchedSkills: { type: "array", items: { type: "string" } },
                          missingSkills: { type: "array", items: { type: "string" } },
                          reasoning: { type: "string" },
                        },
                        required: ["company", "role", "matchScore", "status", "matchedSkills", "missingSkills", "reasoning"],
                      },
                    },
                  },
                  required: ["matches"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "match_jds" } },
        }),
      });

      if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(result.matches), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("No tool call in response");
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("resume-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
