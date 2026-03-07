import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, role, company, transcript, currentQuestionIndex, totalQuestions, userAnswer } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (action === "generate_question") {
      const questionIndex = currentQuestionIndex || 0;
      const total = totalQuestions || 12;

      let questionType = "technical";
      if (questionIndex === 0) questionType = "introduction";
      else if (questionIndex === 1) questionType = "behavioral";
      else if (questionIndex >= total - 2) questionType = "closing";
      else if (questionIndex % 3 === 0) questionType = "behavioral";
      else questionType = "technical";

      const previousContext = transcript && transcript.length > 0
        ? `Previous conversation:\n${transcript.map((t: any) => `${t.role}: ${t.content}`).join("\n")}\n\n`
        : "";

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
              content: `You are a professional interviewer conducting a ${role} interview at ${company}. 
You are asking question ${questionIndex + 1} of ${total}.
Question type: ${questionType}.

Rules:
- For introduction (Q1): Ask "Tell me about yourself and what excites you about ${role}."
- For technical questions: Ask about relevant technologies, algorithms, system design based on the role.
- For behavioral: Use STAR method questions about teamwork, challenges, leadership.
- For closing: Ask if the candidate has questions, or give a scenario-based question.
- Keep questions concise and professional.
- Build on previous answers when possible.
- Vary difficulty - start easier, increase gradually.`,
            },
            {
              role: "user",
              content: `${previousContext}Generate the next interview question. This is question ${questionIndex + 1} of ${total}. Type: ${questionType}.${userAnswer ? `\n\nThe candidate just answered: "${userAnswer}"` : ""}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "ask_question",
                description: "Generate the next interview question",
                parameters: {
                  type: "object",
                  properties: {
                    question: { type: "string", description: "The interview question to ask" },
                    questionType: { type: "string", enum: ["introduction", "technical", "behavioral", "closing"] },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    topic: { type: "string", description: "The topic area of the question" },
                  },
                  required: ["question", "questionType", "difficulty", "topic"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "ask_question" } },
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
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("No tool call in response");
    }

    if (action === "get_coaching_tip") {
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
              content: "You are an interview coach. Analyze the candidate's latest answer and provide a brief coaching tip.",
            },
            {
              role: "user",
              content: `The candidate answered: "${userAnswer}"\n\nProvide one concise coaching tip (max 15 words).`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "coaching_tip",
                description: "Provide a coaching tip",
                parameters: {
                  type: "object",
                  properties: {
                    tip: { type: "string" },
                    type: { type: "string", enum: ["success", "warning", "info"] },
                  },
                  required: ["tip", "type"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "coaching_tip" } },
        }),
      });

      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("No tool call");
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("interviewer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
