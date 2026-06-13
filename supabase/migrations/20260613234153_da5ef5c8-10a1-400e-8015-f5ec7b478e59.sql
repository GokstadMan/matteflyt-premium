
-- 1) Lock down user_roles: only admins can manage role assignments.
CREATE POLICY "Admins manage user roles - insert"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage user roles - update"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage user roles - delete"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Tighten ab_events INSERT — authenticated users can't impersonate other users.
DROP POLICY IF EXISTS "Anyone can insert ab events" ON public.ab_events;
CREATE POLICY "Anyone can insert own ab events"
  ON public.ab_events FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 3) New SECURITY DEFINER function callable only by service_role.
-- award_xp uses auth.uid() and can't run via service role with a user id;
-- award_xp_for takes the user explicitly and is locked down to service_role.
CREATE OR REPLACE FUNCTION public.award_xp_for(_user_id uuid, _xp integer)
  RETURNS public.user_stats
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  row public.user_stats;
  today date := (now() AT TIME ZONE 'UTC')::date;
  safe_xp integer := GREATEST(0, LEAST(COALESCE(_xp, 0), 1000));
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'user id required'; END IF;
  INSERT INTO public.user_stats (user_id, xp, level, streak_days, last_active_date)
  VALUES (_user_id, safe_xp, 1, 1, today)
  ON CONFLICT (user_id) DO UPDATE
    SET xp = public.user_stats.xp + safe_xp,
        streak_days = CASE
          WHEN public.user_stats.last_active_date = today THEN public.user_stats.streak_days
          WHEN public.user_stats.last_active_date = today - 1 THEN public.user_stats.streak_days + 1
          ELSE 1
        END,
        last_active_date = today,
        level = GREATEST(1, ((public.user_stats.xp + safe_xp) / 200) + 1),
        updated_at = now()
  RETURNING * INTO row;
  RETURN row;
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp_for(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_for(uuid, integer) TO service_role;

-- 4) Revoke EXECUTE from clients on SECURITY DEFINER functions they shouldn't call directly.
REVOKE ALL ON FUNCTION public.award_xp(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(integer) TO service_role;

REVOKE ALL ON FUNCTION public.get_ab_stats() FROM PUBLIC, anon;
-- keep authenticated EXECUTE on get_ab_stats — function itself gates on admin role via has_role()
GRANT EXECUTE ON FUNCTION public.get_ab_stats() TO authenticated, service_role;

-- has_role is used inside RLS policies; it must remain callable by authenticated.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- handle_new_user is a trigger function — clients should never call it.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
