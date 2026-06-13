import { useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "mf_visitor_id";
const ASSIGN_PREFIX = "mf_ab_";

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickVariant<V extends string>(experiment: string, variants: readonly V[]): V {
  if (typeof window === "undefined") return variants[0];
  const cacheKey = ASSIGN_PREFIX + experiment;
  const cached = localStorage.getItem(cacheKey) as V | null;
  if (cached && variants.includes(cached)) return cached;
  const visitor = getVisitorId();
  const bucket = hashStr(`${experiment}:${visitor}`) % variants.length;
  const chosen = variants[bucket];
  localStorage.setItem(cacheKey, chosen);
  return chosen;
}

export async function trackAB(
  experiment: string,
  variant: string,
  event: "impression" | "click" | "conversion",
  metadata: Record<string, unknown> = {},
) {
  try {
    const visitor = getVisitorId();
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("ab_events").insert({
      experiment,
      variant,
      event,
      visitor_id: visitor,
      user_id: u.user?.id ?? null,
      metadata,
    });
  } catch (e) {
    // silent — analytics must never break UX
    if (typeof console !== "undefined") console.warn("ab track failed", e);
  }
}

export function useExperiment<V extends string>(
  experiment: string,
  variants: readonly V[],
): { variant: V; track: (event: "click" | "conversion", metadata?: Record<string, unknown>) => void } {
  const variant = useMemo(() => pickVariant(experiment, variants), [experiment, variants]);
  const impressed = useRef(false);

  useEffect(() => {
    if (impressed.current) return;
    impressed.current = true;
    void trackAB(experiment, variant, "impression");
  }, [experiment, variant]);

  return {
    variant,
    track: (event, metadata) => void trackAB(experiment, variant, event, metadata),
  };
}

/**
 * Fire pending conversions registered before a redirect (e.g. signup flow).
 * CTA clicks set a pending key; call this after auth succeeds.
 */
const PENDING_KEY = "mf_ab_pending_conversions";

export function queuePendingConversion(experiment: string, variant: string) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(PENDING_KEY);
  const list: { experiment: string; variant: string }[] = raw ? JSON.parse(raw) : [];
  list.push({ experiment, variant });
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

export async function flushPendingConversions() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return;
  localStorage.removeItem(PENDING_KEY);
  const list: { experiment: string; variant: string }[] = JSON.parse(raw);
  await Promise.all(list.map((l) => trackAB(l.experiment, l.variant, "conversion")));
}

// Centralised experiment registry — keep keys/variants here for the analytics dashboard
export const EXPERIMENTS = {
  hero_cta: ["control", "urgency"] as const,
  pricing: ["control", "discount"] as const,
  final_cta: ["control", "social_proof"] as const,
} satisfies Record<string, readonly string[]>;
