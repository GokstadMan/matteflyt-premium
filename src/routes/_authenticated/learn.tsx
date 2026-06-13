import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BookOpen, Sigma, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { listCourses, getProgress } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({
    meta: [
      { title: "Læringsbibliotek — Alle mattekurs — MatteFlyt" },
      { name: "description", content: "Utforsk alle kurs i MatteFlyt-biblioteket. Algebra, geometri, trigonometri og mer — fortsett der du slapp." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const fetchCourses = useServerFn(listCourses);
  const fetchProgress = useServerFn(getProgress);
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => fetchCourses() });
  const progress = useQuery({ queryKey: ["progress"], queryFn: () => fetchProgress() });

  const completedIds = new Set((progress.data ?? []).map((p: any) => p.lesson_id));

  return (
    <div className="min-h-screen gradient-hero-bg pb-20">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg shadow-soft">
              <Sigma className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-bold tracking-tight">Læringsbibliotek</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold tracking-tight">Kurs</h1>
          <p className="mt-2 text-muted-foreground">Velg et kurs og fortsett der du slapp.</p>
        </motion.div>

        {courses.isLoading && <p className="mt-10 text-muted-foreground">Laster…</p>}
        {courses.error && (
          <p className="mt-10 text-red-600">Kunne ikke laste kurs: {String((courses.error as Error).message)}</p>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-5">
          {(courses.data ?? []).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-3xl p-6 group"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-full bg-primary/10">{c.topic}</span>
                <span className="text-muted-foreground">{c.difficulty}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{c.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              <Link
                to="/learn/$courseId"
                params={{ courseId: c.id }}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                <BookOpen className="h-4 w-4" /> Åpne kurs <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </motion.div>
          ))}
          {courses.data && courses.data.length === 0 && (
            <div className="glass-card rounded-3xl p-8 text-center text-muted-foreground">
              Ingen publiserte kurs ennå.
            </div>
          )}
        </div>

        {progress.data && (
          <p className="mt-8 text-xs text-muted-foreground">
            <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 text-emerald-600" />
            {completedIds.size} leksjon{completedIds.size === 1 ? "" : "er"} fullført totalt.
          </p>
        )}
      </main>
    </div>
  );
}
