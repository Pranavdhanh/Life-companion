-- ============================================================
-- LIFE COMPANION — ADMIN VISIBILITY FIX
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create a secure function to check admin status 
-- (This prevents "infinite recursion" errors in Postgres when checking the profiles table)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- 2. Drop any old/broken admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all game sessions" ON public.game_sessions;

-- 3. Create fresh, working policies that grant Admins full visibility
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING ( public.is_admin() );

CREATE POLICY "Admins can view all patients" ON public.patients
  FOR SELECT USING ( public.is_admin() );
  
CREATE POLICY "Admins can view all game sessions" ON public.game_sessions
  FOR SELECT USING ( public.is_admin() );

-- 4. Ensure RLS is actually turned on for safety
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
