import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useExperiment, queuePendingConversion } from "@/lib/ab";

/* ───────────────── Hero CTA (experiment: hero_cta) ───────────────── */
export function HeroCTA() {
  const { variant, track } = useExperiment("hero_cta", ["control", "urgency"] as const);
  const label = variant === "urgency" ? "Prøv gratis i 30 sekunder" : "Start å lære gratis";
  const sub =
    variant === "urgency" ? (
      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
        <Clock className="h-3 w-3" /> Ingen kortinfo · Avbryt når som helst
      </span>
    ) : null;

  return (
    <div className="flex flex-col">
      <Link
        to="/auth"
        onClick={() => {
          track("click");
          queuePendingConversion("hero_cta", variant);
        }}
        className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-soft hover:shadow-glow-navy hover:-translate-y-0.5 transition-all"
      >
        {label}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
      </Link>
      {sub}
    </div>
  );
}

/* ───────────────── Pricing (experiment: pricing) ───────────────── */
export function PricingExperiment({
  SectionHeader,
}: {
  SectionHeader: React.ComponentType<{ eyebrow: string; title: string; subtitle: string }>;
}) {
  const { variant, track } = useExperiment("pricing", ["control", "discount"] as const);
  const isDiscount = variant === "discount";

  const proPrice = isDiscount ? "99 kr" : "129 kr";
  const oldPrice = isDiscount ? "129 kr" : null;
  const proCta = isDiscount ? "Få 30 dager gratis" : "Bli Pro";
  const proTag = isDiscount ? "Lanseringstilbud" : "Mest populær";

  const plans = [
    {
      name: "Gratis",
      price: "0 kr",
      tag: "Start reisen",
      features: ["20 oppgaver / dag", "Grunnleggende leksjoner", "Enkel fremgangssporing", "Fellesskapsstøtte"],
      cta: "Start gratis",
      featured: false,
    },
    {
      name: "Pro",
      price: proPrice,
      tag: proTag,
      features: [
        "Ubegrensede oppgaver",
        "AI-matteveileder (24/7)",
        "Alle 200+ leksjoner og kurs",
        "Visuell grafutforsker",
        "Avansert analyse",
        "Prioritert support",
      ],
      cta: proCta,
      featured: true,
    },
  ];

  return (
    <section id="pricing" className="py-28 bg-secondary/70">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="Priser"
          title="Enkle planer. Reell fremgang."
          subtitle="Start gratis. Oppgrader når du er klar til å akselerere."
        />

        <div className="mt-16 grid md:grid-cols-2 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 md:p-10 transition-all hover:-translate-y-1 ${
                p.featured ? "gradient-premium-bg text-primary-foreground shadow-glow-navy" : "glass-card"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 right-8 px-3 py-1 rounded-full text-[11px] font-bold bg-[oklch(0.72_0.14_152)] text-primary">
                  {isDiscount ? "−23%" : "ANBEFALT"}
                </span>
              )}
              <div
                className={`text-xs font-semibold uppercase tracking-wider ${
                  p.featured ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {p.tag}
              </div>
              <div className="mt-2 text-2xl font-bold">{p.name}</div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight">{p.price}</span>
                {p.featured && oldPrice && (
                  <span className="text-lg line-through text-primary-foreground/50">{oldPrice}</span>
                )}
                <span
                  className={`text-sm ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  /måned
                </span>
              </div>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 grid place-items-center h-5 w-5 rounded-full ${
                        p.featured ? "bg-primary-foreground/15" : "bg-primary/10"
                      }`}
                    >
                      <Check className={`h-3 w-3 ${p.featured ? "text-primary-foreground" : "text-primary"}`} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                onClick={() => {
                  if (p.featured) {
                    track("click", { plan: p.name });
                    queuePendingConversion("pricing", variant);
                  }
                }}
                className={`mt-10 inline-flex w-full items-center justify-center py-3.5 rounded-full font-semibold transition-all ${
                  p.featured
                    ? "bg-primary-foreground text-primary hover:scale-[1.02]"
                    : "bg-primary text-primary-foreground hover:shadow-glow-navy"
                }`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Final CTA (experiment: final_cta) ───────────────── */
export function FinalCTAExperiment() {
  const { variant, track } = useExperiment("final_cta", ["control", "social_proof"] as const);
  const headline =
    variant === "social_proof"
      ? "10 000+ elever lærer raskere. Bli med."
      : "Klar til å forvandle matteferdighetene dine?";
  const cta = variant === "social_proof" ? "Bli med i dag — gratis" : "Kom i gang i dag";

  return (
    <section id="contact" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] gradient-premium-bg px-8 py-20 md:p-24 text-center shadow-glow-navy">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[oklch(0.72_0.14_152_/_0.3)] blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[oklch(0.6_0.18_220_/_0.35)] blur-3xl" />

          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary-foreground leading-tight">
              {headline}
            </h2>
            {variant === "social_proof" && (
              <div className="mt-6 flex items-center justify-center gap-2 text-primary-foreground/80 text-sm">
                <Users className="h-4 w-4" /> Brukt av elever på 200+ skoler
              </div>
            )}
            <Link
              to="/auth"
              onClick={() => {
                track("click");
                queuePendingConversion("final_cta", variant);
              }}
              className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[oklch(0.97_0.05_153)] text-primary font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-glow-navy transition-all"
            >
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
