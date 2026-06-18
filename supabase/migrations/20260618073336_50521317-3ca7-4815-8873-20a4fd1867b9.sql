
REVOKE EXECUTE ON FUNCTION public.award_xp(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_xp_for(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_for(uuid, integer) TO service_role;
