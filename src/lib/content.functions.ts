import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Course = {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  difficulty: string;
  sort_order: number;
  published: boolean;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  body: string | null;
  video_url: string | null;
  duration_minutes: number;
  xp_reward: number;
  sort_order: number;
  published: boolean;
};

export type UserStats = {
  user_id: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
};

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

// ---------- READ ----------
export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Course[]> => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Course[];
  });

export const listLessons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseId: string }) => d)
  .handler(async ({ data, context }): Promise<Lesson[]> => {
    const { data: rows, error } = await context.supabase
      .from("lessons")
      .select("*")
      .eq("course_id", data.courseId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Lesson[];
  });

export const getProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("lesson_progress")
      .select("lesson_id, completed, completed_at")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getUserStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserStats> => {
    const { data, error } = await context.supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      (data as UserStats) ?? {
        user_id: context.userId,
        xp: 0,
        level: 1,
        streak_days: 0,
        last_active_date: null,
      }
    );
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: Boolean(data) };
  });

// ---------- WRITE: progress + xp ----------
export const completeLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lessonId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: lesson, error: lErr } = await context.supabase
      .from("lessons")
      .select("xp_reward")
      .eq("id", data.lessonId)
      .single();
    if (lErr) throw new Error(lErr.message);

    const { error } = await context.supabase
      .from("lesson_progress")
      .upsert(
        { user_id: context.userId, lesson_id: data.lessonId, completed: true },
        { onConflict: "user_id,lesson_id" },
      );
    if (error) throw new Error(error.message);

    // award_xp is SECURITY DEFINER and EXECUTE is revoked from clients —
    // call via service role with explicit user id.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const xp = Math.min(Math.max(0, lesson?.xp_reward ?? 10), 200);
    const { data: stats, error: xpErr } = await (supabaseAdmin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)("award_xp_for", {
      _user_id: context.userId,
      _xp: xp,
    });
    if (xpErr) throw new Error(xpErr.message);
    return { ok: true as const, stats: (stats ?? null) as null | { user_id: string; xp: number; level: number; streak_days: number; last_active_date: string | null } };
  });

// XP per correct quiz answer. Authoritative on the server — clients do NOT
// supply the XP value. Hard upper bound prevents score-inflation abuse even
// if score/total are inflated.
const XP_PER_CORRECT_ANSWER = 10;
const MAX_XP_PER_QUIZ_ATTEMPT = 200;

export const recordQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { quizId: string; score: number; total: number }) => {
      const quizId = String(d?.quizId ?? "").slice(0, 128);
      const score = Math.max(0, Math.floor(Number(d?.score) || 0));
      const total = Math.max(0, Math.floor(Number(d?.total) || 0));
      if (!quizId) throw new Error("quizId required");
      if (total > 1000) throw new Error("total too large");
      const safeScore = Math.min(score, total);
      return { quizId, score: safeScore, total };
    },
  )
  .handler(async ({ data, context }) => {
    // Server-side XP — never trust the client.
    const xpEarned = Math.min(
      data.score * XP_PER_CORRECT_ANSWER,
      MAX_XP_PER_QUIZ_ATTEMPT,
    );

    const { error } = await context.supabase.from("quiz_attempts").insert({
      user_id: context.userId,
      quiz_id: data.quizId,
      score: data.score,
      total: data.total,
      xp_earned: xpEarned,
    });
    if (error) throw new Error(error.message);

    const { data: stats, error: xpErr } = await context.supabase.rpc("award_xp", {
      _xp: xpEarned,
    });
    if (xpErr) throw new Error(xpErr.message);
    return { ok: true, stats, xpEarned };
  });

// ---------- ADMIN CRUD ----------
export const adminCreateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Omit<Course, "id">) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("courses")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Course;
  });

export const adminUpdateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; patch: Partial<Course> }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("courses")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Omit<Lesson, "id">) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("lessons")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Lesson;
  });

export const adminUpdateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; patch: Partial<Lesson> }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("lessons")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Grant self admin (only works if no admin exists yet — bootstrap)
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) throw new Error("Admin finnes allerede. Be en eksisterende admin om tilgang.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
