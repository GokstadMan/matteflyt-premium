import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sigma,
  Flame,
  Trophy,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  LogOut,
  CheckCircle2,
  Lock,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dashboardSeed } from "@/lib/dashboard-seed";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Mitt dashboard — MatteFlyt" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("der");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.user.id)
        .maybeSingle();
      const fullName =
        profile?.full_name ||
        (u.user.user_metadata?.full_name as string | undefined) ||
        u.user.email?.split("@")[0] ||
        "der";
      setName(fullName.split(" ")[0]);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Du er logget ut");
    navigate({ to: "/" });
  }

  const seed = dashboardSeed;
  const maxMin = Math.max(...seed.weekActivity.map((d) => d.minutes));

  return (
    <div className="min-h-screen gradient-hero-bg pb-20">
      {/* Top bar */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg shadow-soft">
              <Sigma className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-bold tracking-tight">MatteFlyt</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-sm font-semibold">
              <Flame className="h-4 w-4 text-[oklch(0.7_0.18_45)]" /> {seed.streakDays} dager
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary/5 transition"
            >
              <LogOut className="h-4 w-4" /> Logg ut
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Nivå {seed.level} · {seed.xp.toLocaleString("nb-NO")} XP
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
            Hei, {name} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Du er på en {seed.streakDays}-dagers stripe. Fortsett sånn!
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/tutor"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
            >
              <Sparkles className="h-4 w-4" /> Spør AI-mattelæreren Flytur
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
            >
              <Target className="h-4 w-4" /> Start dagens quiz
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Trophy} label="Mestrede emner" value={seed.masteredTopics.toString()} />
          <StatCard icon={Target} label="Løste oppgaver" value={seed.solvedProblems.toString()} />
          <StatCard icon={Clock} label="Min. denne uken" value={seed.weeklyMinutes.toString()} />
          <StatCard icon={TrendingUp} label="Nivå" value={seed.level.toString()} />
        </div>

        {/* Two-column: progress + activity */}
        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 glass-card rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Fremgang per emne</h2>
                <p className="text-sm text-muted-foreground">Hvor godt du kan hvert område.</p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {seed.topics.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-muted-foreground">{t.progress}%</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-secondary/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${t.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 + i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, var(--mf-navy), ${t.color})` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-6 md:p-8"
          >
            <h2 className="text-xl font-bold">Ukens aktivitet</h2>
            <p className="text-sm text-muted-foreground">Studietid per dag.</p>
            <div className="mt-8 flex items-end justify-between gap-2 h-40">
              {seed.weekActivity.map((d, i) => {
                const h = Math.max(8, (d.minutes / maxMin) * 100);
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.6, ease: "easeOut" }}
                      className="w-full rounded-t-lg gradient-premium-bg"
                    />
                    <span className="text-[10px] font-medium text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Totalt</span>
              <span className="font-bold">{seed.weeklyMinutes} min</span>
            </div>
          </motion.section>
        </div>

        {/* Next lessons */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Anbefalt for deg</h2>
            <span className="text-sm text-muted-foreground">Basert på din fremgang</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {seed.nextLessons.map((l, i) => (
              <motion.button
                key={l.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group text-left glass-card rounded-3xl p-6 hover:shadow-glow-navy transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10">
                    {l.topic}
                  </span>
                  <span className="text-xs text-muted-foreground">{l.minutes} min</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{l.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Vanskelighet: {l.difficulty}</p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Start leksjon{" "}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 glass-card rounded-3xl p-6 md:p-8"
        >
          <h2 className="text-xl font-bold">Utmerkelser</h2>
          <p className="text-sm text-muted-foreground">Samle alle 6.</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {seed.achievements.map((a) => (
              <div
                key={a.name}
                className={`rounded-2xl p-4 flex items-center gap-3 transition ${
                  a.unlocked ? "bg-primary/5 border border-primary/15" : "bg-secondary/40 opacity-60"
                }`}
              >
                <div
                  className={`grid place-items-center h-11 w-11 rounded-xl shrink-0 ${
                    a.unlocked ? "gradient-premium-bg text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {a.unlocked ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center gap-3">
        <span className="grid place-items-center h-10 w-10 rounded-xl gradient-premium-bg">
          <Icon className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </span>
      </div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight">{value}</div>
    </motion.div>
  );
}
