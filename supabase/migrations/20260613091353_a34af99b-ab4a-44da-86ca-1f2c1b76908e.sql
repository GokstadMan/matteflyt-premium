
-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  topic text NOT NULL DEFAULT 'Generelt',
  difficulty text NOT NULL DEFAULT 'medium',
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads published courses" ON public.courses
  FOR SELECT TO authenticated USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update courses" ON public.courses
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete courses" ON public.courses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- LESSONS
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  video_url text,
  duration_minutes int NOT NULL DEFAULT 10,
  xp_reward int NOT NULL DEFAULT 20,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_course_idx ON public.lessons(course_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published lessons" ON public.lessons
  FOR SELECT TO authenticated USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert lessons" ON public.lessons
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update lessons" ON public.lessons
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete lessons" ON public.lessons
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- LESSON PROGRESS
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT true,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX lesson_progress_user_idx ON public.lesson_progress(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress all" ON public.lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- QUIZ ATTEMPTS
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id text NOT NULL,
  problem_id text,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  xp_earned int NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_attempts_user_idx ON public.quiz_attempts(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own attempts all" ON public.quiz_attempts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER STATS (XP + streak)
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  streak_days int NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own stats all" ON public.user_stats
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER lessons_updated BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: award XP and update streak atomically
CREATE OR REPLACE FUNCTION public.award_xp(_xp int)
RETURNS public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row public.user_stats;
  today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.user_stats (user_id, xp, level, streak_days, last_active_date)
  VALUES (uid, GREATEST(_xp,0), 1, 1, today)
  ON CONFLICT (user_id) DO UPDATE
    SET xp = public.user_stats.xp + GREATEST(_xp,0),
        streak_days = CASE
          WHEN public.user_stats.last_active_date = today THEN public.user_stats.streak_days
          WHEN public.user_stats.last_active_date = today - 1 THEN public.user_stats.streak_days + 1
          ELSE 1
        END,
        last_active_date = today,
        level = GREATEST(1, ((public.user_stats.xp + GREATEST(_xp,0)) / 200) + 1),
        updated_at = now()
  RETURNING * INTO row;
  RETURN row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.award_xp(int) TO authenticated;

-- Seed a couple of demo courses + lessons
INSERT INTO public.courses (id, title, description, topic, difficulty, sort_order, published) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Algebra grunnkurs', 'Bli trygg på likninger, variabler og uttrykk.', 'Algebra', 'Lett', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Geometri essentials', 'Vinkler, figurer og bevis steg for steg.', 'Geometri', 'Medium', 2, true),
  ('33333333-3333-3333-3333-333333333333', 'Funksjoner & grafer', 'Lineære og kvadratiske funksjoner.', 'Funksjoner', 'Medium', 3, true);

INSERT INTO public.lessons (course_id, title, body, duration_minutes, xp_reward, sort_order, published) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Hva er en variabel?', 'En variabel er et symbol som representerer et tall.', 8, 20, 1, true),
  ('11111111-1111-1111-1111-111111111111', 'Løs enkle likninger', 'Lær å isolere x ved å gjøre samme operasjon på begge sider.', 12, 30, 2, true),
  ('11111111-1111-1111-1111-111111111111', 'Distribusjonsloven', 'a(b + c) = ab + ac. Øv på utvidelse av parenteser.', 10, 25, 3, true),
  ('22222222-2222-2222-2222-222222222222', 'Vinkler og trekanter', 'Sum av vinkler i en trekant er 180°.', 10, 25, 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Pytagoras', 'a² + b² = c² for rettvinklede trekanter.', 14, 35, 2, true),
  ('33333333-3333-3333-3333-333333333333', 'Lineære funksjoner', 'y = ax + b og stigningstall.', 12, 30, 1, true),
  ('33333333-3333-3333-3333-333333333333', 'Kvadratiske funksjoner', 'Parabel, toppunkt og nullpunkter.', 16, 40, 2, true);
