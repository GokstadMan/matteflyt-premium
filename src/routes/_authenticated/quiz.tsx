import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  Sigma,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { quizProblems } from "@/lib/quiz-seed";
import { recordQuizAttempt } from "@/lib/content.functions";
import { toast } from "sonner";
import { useCountUp } from "@/hooks/use-count-up";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Øv på matteoppgaver med hint og fasit — MatteFlyt" },
      { name: "description", content: "Test kunnskapen din med interaktive quizer, få hint steg for steg og umiddelbar tilbakemelding på hver oppgave." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizPage,
});

type Status = "idle" | "correct" | "wrong";

function QuizPage() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [hintsShown, setHintsShown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [xp, setXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const saveAttempt = useServerFn(recordQuizAttempt);
  const qc = useQueryClient();
  const total = quizProblems.length;
  const savedRef = useRef(false);
  const confettiFired = useRef(false);
  const isPerfect = finished && correctCount === total;
  const animatedXp = useCountUp(xp, 1400, finished);

  useEffect(() => {
    if (isPerfect && !confettiFired.current) {
      confettiFired.current = true;
      const defaults = { spread: 55, startVelocity: 45, origin: { y: 0.65 }, scalar: 1.1 };
      const end = Date.now() + 2000;

      const fire = () => {
        if (Date.now() > end) return;
        confetti({ ...defaults, particleCount: 20, angle: 60, origin: { x: 0 } });
        confetti({ ...defaults, particleCount: 20, angle: 120, origin: { x: 1 } });
        requestAnimationFrame(fire);
      };
      fire();
    }
  }, [isPerfect]);

  const problem = quizProblems[idx];
  const progress = useMemo(() => ((idx + (finished ? 1 : 0)) / total) * 100, [idx, finished, total]);

  useEffect(() => {
    if (finished && !savedRef.current) {
      savedRef.current = true;
      saveAttempt({
        data: { quizId: "daily-quiz-v1", score: correctCount, total },
      })
        .then((res) => {
          const awarded = (res as { xpEarned?: number })?.xpEarned ?? xp;
          toast.success(`Lagret! +${awarded} XP til kontoen din`);
          qc.invalidateQueries({ queryKey: ["user-stats"] });
        })
        .catch((e) => toast.error((e as Error).message));
    }
  }, [finished, correctCount, xp, total, saveAttempt, qc]);

  function check() {
    if (!selected) return;
    setAttempts((a) => a + 1);
    if (selected === problem.correctId) {
      setStatus("correct");
      const earned = Math.max(2, problem.xp - hintsShown * 3 - attempts * 2);
      setXp((x) => x + earned);
      setCorrectCount((c) => c + 1);
      toast.success(`Riktig! +${earned} XP`);
    } else {
      setStatus("wrong");
      toast.error("Ikke helt. Prøv et hint!");
    }
  }

  function next() {
    if (idx + 1 >= total) {
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setStatus("idle");
    setHintsShown(0);
    setAttempts(0);
  }

  function restart() {
    savedRef.current = false;
    setIdx(0);
    setSelected(null);
    setStatus("idle");
    setHintsShown(0);
    setAttempts(0);
    setXp(0);
    setCorrectCount(0);
    setFinished(false);
  }

  return (
    <div className="min-h-screen gradient-hero-bg pb-20">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg shadow-soft">
              <Sigma className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-bold tracking-tight">Quiz</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-sm font-semibold">
            <Sparkles className="h-4 w-4" /> {xp} XP
          </div>
        </div>
        <div className="h-1.5 w-full bg-secondary/60">
          <motion.div
            className="h-full gradient-premium-bg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-10">
        {finished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-10 text-center"
          >
            <div className="mx-auto grid place-items-center h-16 w-16 rounded-2xl gradient-premium-bg shadow-soft">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Bra jobba!</h1>
            <p className="mt-2 text-muted-foreground">
              Du fikk {correctCount} av {total} riktig og tjente {xp} XP.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700"
              >
                <RotateCcw className="h-4 w-4" /> Prøv igjen
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-primary/5"
              >
                Til dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.section
              key={problem.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-card rounded-3xl p-6 md:p-8"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-full bg-primary/10">{problem.topic}</span>
                <span className="text-muted-foreground">
                  Spørsmål {idx + 1} av {total} · {problem.difficulty}
                </span>
              </div>
              <h1 className="mt-5 text-2xl md:text-3xl font-extrabold tracking-tight">
                {problem.question}
              </h1>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {problem.choices.map((c) => {
                  const isSelected = selected === c.id;
                  const isCorrect = status !== "idle" && c.id === problem.correctId;
                  const isWrong = status === "wrong" && isSelected;
                  return (
                    <button
                      key={c.id}
                      disabled={status === "correct"}
                      onClick={() => {
                        if (status === "correct") return;
                        setSelected(c.id);
                        if (status === "wrong") setStatus("idle");
                      }}
                      className={`text-left rounded-2xl border p-4 transition-all ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-50"
                          : isWrong
                          ? "border-red-400 bg-red-50"
                          : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{c.label}</span>
                        {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        {isWrong && <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hints */}
              <div className="mt-6 space-y-2">
                <AnimatePresence>
                  {problem.hints.slice(0, hintsShown).map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm"
                    >
                      <Lightbulb className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                      <span>
                        <span className="font-semibold">Hint {i + 1}:</span> {h}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {status === "correct" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4"
                  >
                    <div className="flex items-center gap-2 font-bold text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" /> Riktig!
                    </div>
                    <p className="mt-1 text-sm text-emerald-900/80">{problem.explanation}</p>
                  </motion.div>
                )}
                {status === "wrong" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800"
                  >
                    Det stemmer ikke. Få et hint eller prøv et annet svar.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setHintsShown((h) => Math.min(h + 1, problem.hints.length))}
                  disabled={hintsShown >= problem.hints.length || status === "correct"}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  <Lightbulb className="h-4 w-4" />
                  {hintsShown === 0
                    ? "Vis hint"
                    : hintsShown >= problem.hints.length
                    ? "Ingen flere hint"
                    : `Neste hint (${hintsShown}/${problem.hints.length})`}
                </button>

                {status === "correct" ? (
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700"
                  >
                    {idx + 1 >= total ? "Fullfør" : "Neste oppgave"}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={check}
                    disabled={!selected}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-40"
                  >
                    Sjekk svar
                  </button>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
