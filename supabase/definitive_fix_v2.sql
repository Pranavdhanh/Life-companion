-- ============================================================
-- LIFE COMPANION — DEFINITIVE DATABASE FIX v2
-- Run this ENTIRE script in Supabase SQL Editor → New Query
-- ============================================================

-- STEP 1: Fix ALL broken users right now (no profile row)
-- This inserts a default PATIENT profile for every auth user that has no profile
INSERT INTO profiles (id, role, full_name, preferred_language, onboarding_complete)
SELECT 
  au.id,
  'PATIENT',
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'en',
  false
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also create patient records for those patient profiles that don't have one
INSERT INTO patients (profile_id, difficulty_level)
SELECT p.id, 3
FROM profiles p
LEFT JOIN patients pt ON pt.profile_id = p.id
WHERE p.role = 'PATIENT' AND pt.id IS NULL
ON CONFLICT DO NOTHING;

-- STEP 2: Create the SECURITY DEFINER RPC to create profiles
-- This is called from the browser after signUp and bypasses RLS entirely
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'PATIENT',
  user_language TEXT DEFAULT 'en'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile (SECURITY DEFINER bypasses RLS)
  INSERT INTO profiles (id, role, full_name, preferred_language, onboarding_complete)
  VALUES (user_id, user_role::text, user_full_name, user_language, false)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    preferred_language = EXCLUDED.preferred_language;

  -- If patient, also create patient record
  IF user_role = 'PATIENT' THEN
    INSERT INTO patients (profile_id, difficulty_level)
    VALUES (user_id, 3)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
END;
$$;

-- Grant execute to authenticated and anon (so it can be called right after signUp)
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;

-- STEP 3: Also create a trigger as a backup safety net
-- Use TEXT comparison instead of enum cast (more robust)
CREATE OR REPLACE FUNCTION public.handle_new_user_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, role, full_name, preferred_language, onboarding_complete)
  VALUES (NEW.id, v_role, v_full_name, 'en', false)
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'PATIENT' THEN
    INSERT INTO public.patients (profile_id, difficulty_level)
    VALUES (NEW.id, 3)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth even if this fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trigger();

-- STEP 4: Fix the role column type — make sure it accepts plain text values
-- Check if role is a TEXT column or ENUM — if ENUM, we need to handle casting
-- This makes the profiles.role column work with plain strings
DO $$
BEGIN
  -- Try altering the column to TEXT if it's an enum
  -- (safe: if it's already TEXT, this does nothing)
  EXECUTE 'ALTER TABLE profiles ALTER COLUMN role TYPE TEXT USING role::TEXT';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'role column type unchanged: %', SQLERRM;
END;
$$;

-- STEP 5: Full permissions reset
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- STEP 6: Verify — show current profiles
SELECT 'Done! Current profiles:' as status;
SELECT id, role, full_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;
