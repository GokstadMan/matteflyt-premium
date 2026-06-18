
-- Lock down user_stats: clients can read their row only; all mutations go through award_xp_for (SECURITY DEFINER, service role)
DROP POLICY IF EXISTS "Own stats all" ON public.user_stats;
CREATE POLICY "Own stats select" ON public.user_stats
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Lock down quiz_attempts: clients can read their attempts only; inserts happen server-side via service role with server-computed xp_earned
DROP POLICY IF EXISTS "Own attempts all" ON public.quiz_attempts;
CREATE POLICY "Own attempts select" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
