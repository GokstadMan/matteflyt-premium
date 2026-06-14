import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Flame, ArrowLeft, Sigma } from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/content.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const leaderboardQueryOptions = queryOptions({
  queryKey: ["leaderboard"],
  queryFn: () => getLeaderboard(),
});

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Toppliste — MatteFlyt" },
      { name: "description", content: "Se hvem som har tjent mest XP og holdt lengst streak." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(leaderboardQueryOptions),
  component: Leaderboard,
  errorComponent: ({ error }) => (
    <div className="min-h-screen gradient-hero-bg p-6">
      <div className="mx-auto max-w-3xl glass-card rounded-3xl p-8">
        <h1 className="text-xl font-bold text-destructive">Feil</h1>
        <p className="mt-2 text-muted-foreground">{(error as Error).message}</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Tilbake til dashboard
        </Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen gradient-hero-bg p-6">
      <div className="mx-auto max-w-3xl glass-card rounded-3xl p-8 text-center">
        <h1 className="text-xl font-bold">Ingen data ennå</h1>
        <p className="mt-2 text-muted-foreground">Bli den første til å samle XP!</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Tilbake til dashboard
        </Link>
      </div>
    </div>
  ),
});

function Leaderboard() {
  const fetchLeaderboard = useServerFn(getLeaderboard);
  const { data: entries } = useSuspenseQuery({
    ...leaderboardQueryOptions,
    queryFn: fetchLeaderboard,
  });

  const [myId, setMyId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMyId(data.user.id);
    });
  }, []);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-[oklch(0.75_0.15_85)]" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-[oklch(0.78_0.05_250)]" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-[oklch(0.65_0.12_55)]" />;
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-secondary text-xs font-bold text-muted-foreground">
        {rank}
      </span>
    );
  };

  return (
    <div className="min-h-screen gradient-hero-bg pb-20">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-3xl px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg shadow-soft">
              <Sigma className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-bold tracking-tight">MatteFlyt</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs font-semibold">
            <Trophy className="h-3.5 w-3.5 text-accent-foreground" />
            Toppliste
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            De beste MatteFlyt-spillerne
          </h1>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Se hvem som har mest XP og lengst streak. Klarer du å ta deg inn på topplisten?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 glass-card rounded-3xl overflow-hidden"
        >
          <div className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem] gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/40">
            <span>#</span>
            <span>Spiller</span>
            <span className="text-right">Nivå</span>
            <span className="text-right">XP</span>
            <span className="text-right hidden sm:block">Streak</span>
          </div>

          <div className="divide-y divide-border">
            {entries.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                Ingen har samlet XP ennå. Bli den første!
              </div>
            )}
            {entries.map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.user_id === myId;
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`grid grid-cols-[3rem_1fr_5rem_5rem_5rem] gap-3 px-5 py-3.5 items-center text-sm ${
                    isMe ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center">{rankIcon(rank)}</div>
                  <div className="font-semibold truncate">
                    {entry.full_name || "Anonym spiller"}
                    {isMe && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                        Deg
                      </span>
                    )}
                  </div>
                  <div className="text-right font-bold">{entry.level}</div>
                  <div className="text-right font-bold">{entry.xp.toLocaleString("nb-NO")}</div>
                  <div className="text-right hidden sm:flex items-center justify-end gap-1 text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-[oklch(0.7_0.18_45)]" />
                    {entry.streak_days}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
          >
            <Trophy className="h-4 w-4" />
            Ta en quiz for å tjene XP
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
