import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Sparkles, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadChatMessages, clearChatMessages } from "@/lib/chat.functions";
import { FunctionPlot } from "@/components/tutor/FunctionPlot";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import tutorMascot from "@/assets/tutor-mascot.png";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [
      { title: "AI Mattelærer — Få forklart matte steg for steg — MatteFlyt" },
      { name: "description", content: "Still hvilket som helst mattespørsmål og få en forklaring steg for steg, med funksjonsgrafer og intuitive eksempler." },
      { property: "og:title", content: "AI Mattelærer — MatteFlyt" },
      { property: "og:description", content: "Få mattehjelp i sanntid med forklaringer steg for steg og interaktive grafer." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TutorPage,
});

const SUGGESTIONS = [
  "Forklar Pytagoras' setning steg for steg",
  "Hvordan løser jeg likningen 2x + 5 = 13?",
  "Vis grafen til y = x² - 4 og forklar nullpunktene",
  "Hva er sinus, cosinus og tangens?",
];

function TutorPage() {
  const [bearer, setBearer] = useState<string | null>(null);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setBearer(data.session?.access_token ?? null);
      try {
        const stored = await loadChatMessages();
        setInitial(stored as unknown as UIMessage[]);
      } catch {
        setInitial([]);
      }
    })();
  }, []);

  if (!bearer || initial === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <Chat bearer={bearer} initial={initial} input={input} setInput={setInput} bottomRef={bottomRef} inputRef={inputRef} />;
}

function Chat({
  bearer,
  initial,
  input,
  setInput,
  bottomRef,
  inputRef,
}: {
  bearer: string;
  initial: UIMessage[];
  input: string;
  setInput: (v: string) => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: { Authorization: `Bearer ${bearer}` },
      }),
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "math-tutor",
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "Noe gikk galt"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, bottomRef]);

  useEffect(() => {
    if (status === "ready") inputRef.current?.focus();
  }, [status, inputRef]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const busy = status === "submitted" || status === "streaming";

  async function handleSend(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  }

  async function handleClear() {
    if (!confirm("Slette hele samtalen?")) return;
    try {
      await clearChatMessages();
      setMessages([]);
      toast.success("Samtalen er slettet");
    } catch {
      toast.error("Kunne ikke slette samtalen");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40">
      <header className="sticky top-0 z-10 border-b border-emerald-100/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-800 hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" /> Tilbake
          </Link>
          <div className="flex items-center gap-2">
            <img src={tutorMascot} alt="Flytur mascot" width={32} height={32} className="h-8 w-8" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-emerald-900">Flytur</div>
              <div className="text-[10px] text-emerald-700/70">Din AI-mattelærer</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={messages.length === 0 || busy}
            className="text-emerald-800 hover:bg-emerald-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {messages.length === 0 ? (
          <Welcome onPick={(s) => handleSend(s)} />
        ) : (
          <div className="space-y-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Flytur tenker…
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <div className="sticky bottom-0 border-t border-emerald-100/60 bg-white/80 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="mx-auto flex max-w-4xl items-end gap-2 px-4 py-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Spør om en oppgave, et tema eller en graf…"
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm text-emerald-950 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />
          <Button
            type="submit"
            disabled={!input.trim() || busy}
            className="h-11 rounded-2xl bg-emerald-600 px-4 text-white hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (s: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-8 max-w-2xl text-center"
    >
      <img
        src={tutorMascot}
        alt="Flytur"
        width={120}
        height={120}
        className="mx-auto h-28 w-28"
      />
      <h1 className="mt-4 font-display text-3xl font-bold text-emerald-950">
        Hei! Jeg er Flytur.
      </h1>
      <p className="mt-2 text-emerald-800/80">
        Spør om en oppgave eller et tema — jeg forklarer steg for steg og tegner grafer når det
        hjelper.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group flex items-start gap-2 rounded-xl border border-emerald-200/70 bg-white/70 p-3 text-left text-sm text-emerald-900 shadow-sm transition hover:border-emerald-400 hover:bg-white"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 group-hover:text-emerald-600" />
            <span>{s}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

type TextPart = { type: "text"; text: string };
type PlotPart = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: { expression: string; xMin: number; xMax: number; label: string };
  output?: { expression: string; xMin: number; xMax: number; label: string };
};
type Part = TextPart | PlotPart;

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5 text-white shadow-sm"
            : "max-w-[92%] space-y-3"
        }
      >
        {(message.parts as Part[]).map((part, i) => {
          if (part.type === "text" && "text" in part) {
            if (isUser) {
              return (
                <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
                  {(part as TextPart).text}
                </p>
              );
            }
            return (
              <div
                key={i}
                className="prose prose-sm max-w-none text-emerald-950 prose-headings:text-emerald-900 prose-strong:text-emerald-900 prose-code:rounded prose-code:bg-emerald-50 prose-code:px-1 prose-code:py-0.5 prose-code:text-emerald-800 prose-code:before:content-none prose-code:after:content-none prose-p:my-2 prose-li:my-0.5"
              >
                <ReactMarkdown>{(part as TextPart).text}</ReactMarkdown>
              </div>
            );
          }
          if (part.type === "tool-plot_function") {
            const data = part.output ?? part.input;
            if (!data) {
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-700">
                  <Loader2 className="h-3 w-3 animate-spin" /> Tegner graf…
                </div>
              );
            }
            return (
              <FunctionPlot
                key={i}
                expression={data.expression}
                xMin={data.xMin}
                xMax={data.xMax}
                label={data.label}
              />
            );
          }
          return null;
        })}
      </div>
    </motion.div>
  );
}
