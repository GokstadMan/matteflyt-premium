import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sigma, CheckCircle2, Circle, Sparkles, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { listLessons, getProgress, completeLesson, listCourses } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/learn/$courseId")({
  head: () => ({ meta: [{ title: "Kurs — MatteFlyt" }] }),
  component: CoursePage,
});

function CoursePage() {
  const { courseId } = Route.useParams();
  const qc = useQueryClient();
  const fetchLessons = useServerFn(listLessons);
  const fetchProgress = useServerFn(getProgress);
  const fetchCourses = useServerFn(listCourses);
  const completeFn = useServerFn(completeLesson);

  const lessons = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => fetchLessons({ data: { courseId } }),
  });
  const progress = useQuery({ queryKey: ["progress"], queryFn: () => fetchProgress() });
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => fetchCourses() });
  const course = courses.data?.find((c) => c.id === courseId);

  const completedIds = new Set((progress.data ?? []).map((p: any) => p.lesson_id));

  async function markComplete(lessonId: string) {
    try {
      const res = await completeFn({ data: { lessonId } });
      toast.success("Leksjon fullført! +XP");
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      return res;
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen gradient-hero-bg pb-20">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
          <Link to="/learn" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80">
            <ArrowLeft className="h-4 w-4" /> Alle kurs
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg shadow-soft">
              <Sigma className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-bold tracking-tight">Kurs</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-10">
        {course && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10">{course.topic}</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{course.title}</h1>
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          </motion.div>
        )}

        <div className="mt-8 space-y-4">
          {(lessons.data ?? []).map((l, i) => {
            const done = completedIds.has(l.id);
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-5 md:p-6 flex items-start gap-4"
              >
                <div className="shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  ) : (
                    <Circle className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{l.title}</h3>
                  {l.body && <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{l.duration_minutes} min</span>
                    <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{l.xp_reward} XP</span>
                  </div>
                </div>
                <button
                  onClick={() => markComplete(l.id)}
                  disabled={done}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {done ? "Fullført" : "Marker fullført"}
                </button>
              </motion.div>
            );
          })}
          {lessons.data && lessons.data.length === 0 && (
            <div className="glass-card rounded-3xl p-8 text-center text-muted-foreground">
              Ingen leksjoner publisert i dette kurset ennå.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
