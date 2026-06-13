import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  Brain,
  LineChart,
  Compass,
  Check,
  ArrowRight,
  Play,
  Star,
  Menu,
  X,
  Twitter,
  Github,
  Linkedin,
  Youtube,
  Sigma,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HeroCTA, PricingExperiment, FinalCTAExperiment } from "@/components/landing/Experiments";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MatteFlyt — AI-mattelærer som forklarer steg for steg" },
      {
        name: "description",
        content:
          "Lær matte raskere med interaktive leksjoner, quizer og en personlig AI-tutor som forklarer hver løsning steg for steg.",
      },
      { property: "og:title", content: "MatteFlyt — AI-mattelærer som forklarer steg for steg" },
      {
        property: "og:description",
        content:
          "Lær matte raskere med interaktive leksjoner, quizer og en personlig AI-tutor som forklarer hver løsning steg for steg.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const nav = [
  { label: "Funksjoner", href: "#features" },
  { label: "Kurs", href: "#courses" },
  { label: "Priser", href: "#pricing" },
  { label: "Anmeldelser", href: "#testimonials" },
  { label: "Kontakt", href: "#contact" },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden text-foreground">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingExperiment SectionHeader={SectionHeader} />
      <FinalCTAExperiment />
      <Footer />
    </div>
  );
}

/* ───────────────────────── NAV ───────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => {
      window.removeEventListener("scroll", on);
      sub.subscription.unsubscribe();
    };
  }, []);
  const ctaTo = authed ? "/dashboard" : "/auth";
  const ctaLabel = authed ? "Mitt dashboard" : "Kom i gang";


  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav py-2 sm:py-3" : "py-3 sm:py-5 bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-3">
        <a href="#" className="flex items-center gap-2 group min-w-0 shrink-0">
          <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg shadow-soft shrink-0">
            <Sigma className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-lg font-bold tracking-tight truncate">MatteFlyt</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="text-sm font-medium text-foreground/75 hover:text-foreground transition relative after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {!authed && (
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-primary/5 transition"
            >
              Logg inn
            </Link>
          )}
          <Link
            to={ctaTo}
            className="group inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full bg-primary text-primary-foreground shadow-soft hover:shadow-glow-navy hover:-translate-y-0.5 transition-all"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Lukk meny" : "Åpne meny"}
          aria-expanded={open}
          className="md:hidden inline-grid place-items-center h-11 w-11 rounded-xl hover:bg-primary/5 active:bg-primary/10"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mx-3 sm:mx-6 mt-3 glass-card rounded-2xl p-3 flex flex-col gap-1 shadow-soft">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 min-h-11 flex items-center rounded-xl text-base font-medium hover:bg-primary/5 active:bg-primary/10"
            >
              {n.label}
            </a>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {!authed && (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="flex-1 py-3 min-h-11 text-sm font-semibold rounded-full border border-border text-center inline-flex items-center justify-center"
              >
                Logg inn
              </Link>
            )}
            <Link
              to={ctaTo}
              onClick={() => setOpen(false)}
              className="flex-1 py-3 min-h-11 text-sm font-semibold rounded-full bg-primary text-primary-foreground text-center inline-flex items-center justify-center"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ───────────────────────── HERO ───────────────────────── */
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 80]);

  return (
    <section className="relative min-h-screen gradient-hero-bg pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--mf-navy) 1px, transparent 1px), linear-gradient(90deg, var(--mf-navy) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            Brukt av 10 000+ elever
          </div>

          <h1 className="mt-5 sm:mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
            Mestre matematikk
          </h1>

          <p className="mt-5 sm:mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Interaktive leksjoner, AI-drevne forklaringer og steg-for-steg-løsninger laget for å hjelpe elever å lære
            raskere.
          </p>

          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <HeroCTA />

            <button className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-12 rounded-full glass-card font-semibold hover:-translate-y-0.5 transition-all">
              <span className="grid place-items-center h-7 w-7 rounded-full bg-primary text-primary-foreground">
                <Play className="h-3.5 w-3.5 ml-0.5" />
              </span>
              Se demo
            </button>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-5 text-sm text-muted-foreground">
            <div className="flex -space-x-2 shrink-0">
              {["A", "B", "C", "D"].map((c, i) => (
                <div
                  key={c}
                  className="h-8 w-8 rounded-full ring-2 ring-background grid place-items-center text-xs font-bold text-primary-foreground"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.${30 + i * 8} 0.09 ${
                      200 + i * 20
                    }), oklch(0.${50 + i * 5} 0.12 ${160 - i * 10}))`,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
              <span className="ml-1 font-semibold text-foreground">4,9</span>
              <span>fra 2 400+ anmeldelser</span>
            </div>
          </div>
        </motion.div>

        <motion.div style={{ y }} className="relative h-[380px] sm:h-[460px] md:h-[520px] lg:h-[600px]">
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle at 60% 40%, oklch(0.85 0.13 152 / 0.6), transparent 60%)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="absolute inset-x-4 top-8 bottom-8 glass-card rounded-3xl p-6 overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.7_0.18_25)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.82_0.14_85)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.72_0.14_152)]" />
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">leksjon_42.calc</div>
        </div>

        <div className="mt-5 text-xs font-mono text-muted-foreground">Løs for x</div>
        <div className="mt-2 text-2xl font-bold tracking-tight">
          ∫<sub>0</sub>
          <sup>π</sup> sin(x) dx = <span className="gradient-text">2</span>
        </div>

        <svg viewBox="0 0 320 140" className="mt-6 w-full">
          <defs>
            <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.14 152)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="oklch(0.72 0.14 152)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              x2="320"
              y1={35 * i + 10}
              y2={35 * i + 10}
              stroke="oklch(0.215 0.06 257 / 0.08)"
              strokeDasharray="3 4"
            />
          ))}
          <path
            d="M0,110 C40,40 80,30 120,70 S200,130 240,60 300,20 320,40"
            fill="none"
            stroke="var(--mf-navy)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ strokeDasharray: 800, strokeDashoffset: 800, animation: "draw-line 2.5s ease-out 0.6s forwards" }}
          />
          <path
            d="M0,110 C40,40 80,30 120,70 S200,130 240,60 300,20 320,40 L320,140 L0,140 Z"
            fill="url(#g1)"
            opacity="0"
            style={{ animation: "fade-in 1s ease-out 2s forwards" }}
          />
          {[
            [60, 75],
            [140, 85],
            [220, 68],
            [290, 35],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="4"
              fill="var(--mf-navy)"
              style={{ animation: `pulse-soft 2.5s ease-in-out ${i * 0.3}s infinite` }}
            />
          ))}
        </svg>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { l: "Treffsikkerhet", v: "98%" },
            { l: "Rekke", v: "14d" },
            { l: "XP", v: "2 340" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-secondary/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="text-base font-bold">{s.v}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute -left-2 top-16 glass-card rounded-2xl px-4 py-3 animate-float-slow"
      >
        <div className="text-[10px] font-mono text-muted-foreground">Pytagoras</div>
        <div className="text-lg font-bold mt-0.5">a² + b² = c²</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute -right-2 top-32 glass-card rounded-2xl p-3 animate-float-medium"
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          <polygon points="40,8 72,64 8,64" fill="none" stroke="var(--mf-navy)" strokeWidth="2" />
          <circle cx="40" cy="48" r="18" fill="none" stroke="oklch(0.72 0.14 152)" strokeWidth="2" />
          <rect
            x="22"
            y="30"
            width="36"
            height="36"
            fill="none"
            stroke="var(--mf-navy)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="absolute -left-2 bottom-6 glass-card rounded-2xl px-4 py-3 flex items-center gap-3 animate-float-medium"
      >
        <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg">
          <Brain className="h-4 w-4 text-primary-foreground" />
        </span>
        <div>
          <div className="text-[10px] font-mono text-muted-foreground">AI-veileder</div>
          <div className="text-xs font-semibold">Steg forklart ✓</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute right-6 bottom-16 h-16 w-16 rounded-2xl gradient-premium-bg grid place-items-center text-primary-foreground text-3xl font-bold animate-float-slow shadow-glow-navy"
      >
        π
      </motion.div>
    </div>
  );
}

/* ───────────────────────── STATS ───────────────────────── */
function Stats() {
  const items = [
    { v: "50 000+", l: "Oppgaver løst" },
    { v: "10 000+", l: "Elever" },
    { v: "95%", l: "Tilfredshet" },
    { v: "200+", l: "Leksjoner" },
  ];
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {items.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center md:text-left"
            >
              <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight gradient-text">{s.v}</div>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FEATURES ───────────────────────── */
function Features() {
  const items = [
    {
      icon: Compass,
      title: "Interaktiv problemløsning",
      desc: "Dra, tegn og utforsk oppgaver i sanntid. Feil blir til øyeblikk for læring.",
    },
    {
      icon: Brain,
      title: "AI-matteveileder",
      desc: "En alltid tilgjengelig veileder som forklarer hvert steg på et språk tilpasset ditt nivå.",
    },
    {
      icon: LineChart,
      title: "Visuell grafutforsker",
      desc: "Endre ligninger og se grafene respondere umiddelbart — matte du endelig kan se.",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Funksjoner"
          title="Bygget for hvordan elever faktisk lærer"
          subtitle="Hvert verktøy i MatteFlyt er laget for å fjerne friksjon og erstatte den med innsikt."
        />

        <div className="mt-10 sm:mt-16 grid md:grid-cols-3 gap-6">
          {items.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="group glass-card rounded-3xl p-6 sm:p-8 hover:-translate-y-1 hover:shadow-glow-navy transition-all duration-300"
            >
              <span className="inline-grid place-items-center h-12 w-12 rounded-2xl gradient-premium-bg shadow-soft group-hover:scale-110 transition">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </span>
              <h3 className="mt-6 text-xl font-bold">{f.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition">
                Les mer <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── HOW IT WORKS ───────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Velg tema", d: "Velg blant 200+ strukturerte leksjoner innen algebra, kalkulus, geometri og mer." },
    { n: "02", t: "Øv på oppgaver", d: "Løs tilpassede oppgavesett med umiddelbar tilbakemelding fra AI-veilederen." },
    { n: "03", t: "Følg fremgangen", d: "Se rekken vokse og svake punkter forsvinne på ditt personlige dashbord." },
  ];
  return (
    <section id="courses" className="py-16 sm:py-24 md:py-28 bg-secondary/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Slik fungerer det"
          title="Tre steg til mestring"
          subtitle="En fokusert sløyfe designet av lærere og ingeniører."
        />

        <div className="mt-10 sm:mt-16 relative grid md:grid-cols-3 gap-10 sm:gap-8">
          <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-2xl gradient-premium-bg grid place-items-center text-primary-foreground font-bold shadow-glow-navy relative z-10">
                {s.n}
              </div>
              <h3 className="mt-6 text-xl font-bold">{s.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── TESTIMONIALS ───────────────────────── */
function Testimonials() {
  const items = [
    {
      n: "Amelia Chen",
      r: "Elev, matematikk R2",
      q: "MathFlow fikk endelig integraler til å gi mening. De visuelle grafene er som intet jeg har sett i læreboka.",
      i: "AC",
      g: "linear-gradient(135deg,#0ea5e9,#22d3ee)",
    },
    {
      n: "Marcus Bell",
      r: "Avgangselev videregående",
      q: "AI-veilederen forklarer hvert steg. Jeg gikk fra 3 til 5 på ett semester.",
      i: "MB",
      g: "linear-gradient(135deg,#16a34a,#84cc16)",
    },
    {
      n: "Priya Raman",
      r: "Førsteårs ingeniørstudent",
      q: "Jeg bruker MathFlow som oppvarming før forelesning. Det betaler seg hver uke.",
      i: "PR",
      g: "linear-gradient(135deg,#7c3aed,#ec4899)",
    },
  ];
  return (
    <section id="testimonials" className="py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Elsket av elever" title="Ekte fremgang, med deres egne ord" />
        <div className="mt-10 sm:mt-16 grid md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.div
              key={t.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-3xl p-6 sm:p-7 hover:-translate-y-1 transition-all"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mt-5 text-foreground/90 leading-relaxed">“{t.q}”</p>
              <div className="mt-7 flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-full grid place-items-center text-sm font-bold text-white"
                  style={{ background: t.g }}
                >
                  {t.i}
                </div>
                <div>
                  <div className="text-sm font-bold">{t.n}</div>
                  <div className="text-xs text-muted-foreground">{t.r}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── PRICING ───────────────────────── */
function Pricing() {
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
      price: "129 kr",
      tag: "Mest populær",
      features: [
        "Ubegrensede oppgaver",
        "AI-matteveileder (24/7)",
        "Alle 200+ leksjoner og kurs",
        "Visuell grafutforsker",
        "Avansert analyse",
        "Prioritert support",
      ],
      cta: "Bli Pro",
      featured: true,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 md:py-28 bg-secondary/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Priser"
          title="Enkle planer. Reell fremgang."
          subtitle="Start gratis. Oppgrader når du er klar til å akselerere."
        />

        <div className="mt-10 sm:mt-16 grid md:grid-cols-2 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-6 sm:p-8 md:p-10 transition-all hover:-translate-y-1 ${
                p.featured ? "gradient-premium-bg text-primary-foreground shadow-glow-navy" : "glass-card"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 right-8 px-3 py-1 rounded-full text-[11px] font-bold bg-[oklch(0.72_0.14_152)] text-primary">
                  ANBEFALT
                </span>
              )}
              <div
                className={`text-xs font-semibold uppercase tracking-wider ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {p.tag}
              </div>
              <div className="mt-2 text-2xl font-bold">{p.name}</div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">{p.price}</span>
                <span className={`text-sm ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  /måned
                </span>
              </div>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 grid place-items-center h-5 w-5 rounded-full ${p.featured ? "bg-primary-foreground/15" : "bg-primary/10"}`}
                    >
                      <Check className={`h-3 w-3 ${p.featured ? "text-primary-foreground" : "text-primary"}`} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-10 w-full py-3.5 rounded-full font-semibold transition-all ${
                  p.featured
                    ? "bg-primary-foreground text-primary hover:scale-[1.02]"
                    : "bg-primary text-primary-foreground hover:shadow-glow-navy"
                }`}
              >
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */
function FinalCTA() {
  return (
    <section id="contact" className="py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] gradient-premium-bg px-6 py-14 sm:px-8 sm:py-20 md:p-24 text-center shadow-glow-navy">
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
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-primary-foreground leading-tight">
              Klar til å forvandle <br className="hidden md:block" />
              matteferdighetene dine?
            </h2>
            <p className="mt-5 sm:mt-6 max-w-xl mx-auto text-sm sm:text-base text-primary-foreground/80">
              Bli med 10 000+ elever som allerede lærer raskere med MatteFlyt.
            </p>
            <Link
              to="/auth"
              className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[oklch(0.97_0.05_153)] text-primary font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-glow-navy transition-all"
            >
              Kom i gang i dag
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */
function Footer() {
  const cols = [
    { t: "Produkt", l: ["Funksjoner", "Kurs", "Priser", "Endringslogg"] },
    { t: "Selskap", l: ["Om oss", "Blogg", "Karriere", "Kontakt"] },
    { t: "Ressurser", l: ["Hjelpesenter", "Fellesskap", "Guider", "API"] },
  ];
  return (
    <footer className="border-t border-border bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 grid sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-premium-bg">
              <Sigma className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-lg font-bold tracking-tight">MatteFlyt</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Visuell og interaktiv matematikklæring for den neste generasjonen nysgjerrige sinn.
          </p>
          <div className="mt-6 flex items-center gap-2">
            {[Twitter, Github, Linkedin, Youtube].map((Ic, i) => (
              <a
                key={i}
                href="#"
                className="h-9 w-9 grid place-items-center rounded-full glass-card hover:-translate-y-0.5 transition"
              >
                <Ic className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.t}>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">{c.t}</div>
            <ul className="mt-4 space-y-2.5">
              {c.l.map((x) => (
                <li key={x}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
                    {x}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} MatteFlyt. Alle rettigheter reservert.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">
              Personvern
            </a>
            <a href="#" className="hover:text-foreground">
              Vilkår
            </a>
            <a href="#" className="hover:text-foreground">
              Informasjonskapsler
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────── HELPERS ───────────────────────── */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </div>
      <h2 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">{title}</h2>
      {subtitle && <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
  );
}
