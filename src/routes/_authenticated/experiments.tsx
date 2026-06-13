import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, TrendingUp, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({
    meta: [
      { title: "A/B-eksperimenter — MatteFlyt" },
      { name: "description", content: "Se resultater fra pågående A/B-eksperimenter på landingssiden — CTR og konverteringer per variant." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExperimentsPage,
});

type Row = { experiment: string; variant: string; event: string; count: number };

type Agg = {
  experiment: string;
  variant: string;
  impressions: number;
  clicks: number;
  conversions: number;
};

function ExperimentsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_ab_stats");
      if (error) {
        setError(error.message);
        return;
      }
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  const aggMap = new Map<string, Agg>();
  (rows ?? []).forEach((r) => {
    const key = `${r.experiment}::${r.variant}`;
    const cur =
      aggMap.get(key) ??
      ({ experiment: r.experiment, variant: r.variant, impressions: 0, clicks: 0, conversions: 0 } as Agg);
    if (r.event === "impression") cur.impressions = Number(r.count);
    if (r.event === "click") cur.clicks = Number(r.count);
    if (r.event === "conversion") cur.conversions = Number(r.count);
    aggMap.set(key, cur);
  });
  const byExperiment = new Map<string, Agg[]>();
  aggMap.forEach((a) => {
    const arr = byExperiment.get(a.experiment) ?? [];
    arr.push(a);
    byExperiment.set(a.experiment, arr);
  });

  return (
    <div className="min-h-screen gradient-hero-bg pb-20">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="font-bold tracking-tight">A/B-eksperimenter</div>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-10 space-y-8">
        {error && (
          <div className="glass-card rounded-2xl p-6 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold">Tilgang nektet</div>
              <p className="text-sm text-muted-foreground mt-1">
                Bare brukere med admin-rollen kan se eksperimentdata. Be en admin gi deg rollen i tabellen{" "}
                <code>user_roles</code>.
              </p>
              <p className="text-xs text-muted-foreground mt-2">Detaljer: {error}</p>
            </div>
          </div>
        )}

        {!error && rows && rows.length === 0 && (
          <div className="glass-card rounded-2xl p-6 text-sm text-muted-foreground">
            Ingen data ennå. Besøk landingssiden for å generere visninger.
          </div>
        )}

        {Array.from(byExperiment.entries()).map(([exp, variants]) => {
          const totalImpr = variants.reduce((s, v) => s + v.impressions, 0);
          return (
            <section key={exp} className="glass-card rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">{exp}</h2>
                <span className="ml-auto text-xs text-muted-foreground">{totalImpr} totale visninger</span>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4">Variant</th>
                      <th className="py-2 pr-4">Visninger</th>
                      <th className="py-2 pr-4">Klikk</th>
                      <th className="py-2 pr-4">CTR</th>
                      <th className="py-2 pr-4">Konverteringer</th>
                      <th className="py-2 pr-4">CVR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants
                      .sort((a, b) => a.variant.localeCompare(b.variant))
                      .map((v) => {
                        const ctr = v.impressions ? (v.clicks / v.impressions) * 100 : 0;
                        const cvr = v.impressions ? (v.conversions / v.impressions) * 100 : 0;
                        return (
                          <tr key={v.variant} className="border-t border-border">
                            <td className="py-3 pr-4 font-semibold">{v.variant}</td>
                            <td className="py-3 pr-4">{v.impressions}</td>
                            <td className="py-3 pr-4">{v.clicks}</td>
                            <td className="py-3 pr-4">{ctr.toFixed(1)}%</td>
                            <td className="py-3 pr-4">{v.conversions}</td>
                            <td className="py-3 pr-4 font-semibold text-emerald-700">{cvr.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
