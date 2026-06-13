
-- Roles infrastructure (needed to gate analytics)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- A/B events
CREATE TABLE public.ab_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment text NOT NULL,
  variant text NOT NULL,
  event text NOT NULL,
  visitor_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ab_events_exp_variant_event_idx ON public.ab_events (experiment, variant, event);
CREATE INDEX ab_events_visitor_idx ON public.ab_events (visitor_id);

GRANT SELECT, INSERT ON public.ab_events TO anon;
GRANT SELECT, INSERT ON public.ab_events TO authenticated;
GRANT ALL ON public.ab_events TO service_role;

ALTER TABLE public.ab_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert events (anonymous tracking)
CREATE POLICY "Anyone can insert ab events" ON public.ab_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only admins can read raw events
CREATE POLICY "Admins read ab events" ON public.ab_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Aggregated stats function (admin only)
CREATE OR REPLACE FUNCTION public.get_ab_stats()
RETURNS TABLE (experiment text, variant text, event text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT experiment, variant, event, count(*)::bigint
  FROM public.ab_events
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY experiment, variant, event
  ORDER BY experiment, variant, event
$$;

GRANT EXECUTE ON FUNCTION public.get_ab_stats() TO authenticated;
