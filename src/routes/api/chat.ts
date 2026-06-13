import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `Du er Flytur, en vennlig norsk AI-mattelærer for elever på ungdomsskole og videregående.

REGLER:
- Forklar alltid løsninger STEG FOR STEG. Nummerer trinnene.
- Bruk klart, oppmuntrende språk på norsk (bokmål).
- Bruk markdown for formatering. Skriv matteuttrykk i kodeformat, f.eks. \`x^2 + 3x\`.
- Når en oppgave handler om en funksjon eller graf (f.eks. y = x^2, sinus, lineære funksjoner), KALL plot_function-verktøyet for å vise grafen sammen med forklaringen.
- Etter en forklaring, still ett oppfølgingsspørsmål for å sjekke forståelse.
- Hvis spørsmålet ikke handler om matte, vri det vennlig tilbake til matte.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Cap raw body size to prevent token cost abuse.
        const MAX_BODY_BYTES = 256 * 1024; // 256 KB
        const MAX_MESSAGES = 30;
        const MAX_MESSAGE_CHARS = 8000;
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength && contentLength > MAX_BODY_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }
        const rawBody = await request.text();
        if (rawBody.length > MAX_BODY_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        const authHeader = request.headers.get("Authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const userClient = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userError } = await userClient.auth.getUser();
        if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        let parsed: { messages?: UIMessage[] };
        try {
          parsed = JSON.parse(rawBody) as { messages?: UIMessage[] };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const incoming = Array.isArray(parsed.messages) ? parsed.messages : [];
        // Only trust 'user' messages from the client — assistant/system roles
        // could be forged to inject prompts. Cap count and per-message size.
        const messages = incoming
          .filter((m) => m && m.role === "user")
          .slice(-MAX_MESSAGES)
          .map((m) => {
            const parts = Array.isArray(m.parts)
              ? m.parts.map((p) => {
                  if (p && typeof p === "object" && "text" in p && typeof (p as { text: unknown }).text === "string") {
                    const text = (p as { text: string }).text.slice(0, MAX_MESSAGE_CHARS);
                    return { ...p, text };
                  }
                  return p;
                })
              : m.parts;
            return { ...m, parts } as UIMessage;
          });
        if (messages.length === 0) {
          return new Response("No user message", { status: 400 });
        }

        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!lovableKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(lovableKey);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
            plot_function: tool({
              description:
                "Plotter en matematisk funksjon y = f(x) som en graf. Bruk denne når du forklarer funksjoner, lineære/kvadratiske uttrykk, trigonometri eller grafiske løsninger.",
              inputSchema: z.object({
                expression: z
                  .string()
                  .describe(
                    "Matematisk uttrykk i x, f.eks. 'x^2 - 3*x + 2', 'sin(x)', '2*x + 1'. Bruk *, /, ^, sin, cos, tan, sqrt, log, abs.",
                  ),
                xMin: z.number().describe("Minste x-verdi, f.eks. -10"),
                xMax: z.number().describe("Største x-verdi, f.eks. 10"),
                label: z.string().describe("Kort tittel for grafen, f.eks. 'y = x²'"),
              }),
              execute: async (input) => input,
            }),
          },
          onFinish: async ({ response }) => {
            try {
              // Save the user message (last in input) and the assistant response
              const lastUser = [...messages].reverse().find((m) => m.role === "user");
              const rows: { user_id: string; role: string; parts: unknown }[] = [];
              if (lastUser) {
                rows.push({
                  user_id: userId,
                  role: "user",
                  parts: lastUser.parts as unknown,
                });
              }
              for (const m of response.messages) {
                if (m.role === "assistant") {
                  // Convert assistant content to UIMessage-like parts
                  const parts: unknown[] = [];
                  for (const c of m.content as Array<{
                    type: string;
                    text?: string;
                    toolName?: string;
                    toolCallId?: string;
                    input?: unknown;
                  }>) {
                    if (c.type === "text" && c.text) {
                      parts.push({ type: "text", text: c.text });
                    } else if (c.type === "tool-call" && c.toolName) {
                      parts.push({
                        type: `tool-${c.toolName}`,
                        toolCallId: c.toolCallId,
                        state: "output-available",
                        input: c.input,
                        output: c.input,
                      });
                    }
                  }
                  rows.push({ user_id: userId, role: "assistant", parts });
                }
              }
              if (rows.length) {
                await userClient.from("chat_messages").insert(rows);
              }
            } catch (e) {
              console.error("Failed to persist chat messages", e);
            }
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
