
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_ab_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ab_stats() TO authenticated, service_role;
COMMENT ON POLICY "Anyone can insert ab events" ON public.ab_events IS 'Intentional: anonymous A/B impression/click tracking from the public landing page.';
