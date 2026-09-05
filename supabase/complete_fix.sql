-- ============================================================
-- LIFE COMPANION — COMPLETE DATABASE FIX
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Step 1: Fix the existing broken user account
-- Insert the missing profile for user 7fede012-72e5-4a7e-978e-754568d6e726
-- We default to PATIENT role — you can change this after
INSERT INTO profiles (id, role, full_name, preferred_language, onboarding_complete)
VALUES ('7fede012-72e5-4a7e-978e-754568d6e726', 'PATIENT', 'User', 'en', false)
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- Also ensure they have a patient record
INSERT INTO patients (profile_id, difficulty_level)
VALUES ('7fede012-72e5-4a7e-978e-754568d6e726', 3)
ON CONFLICT (profile_id) DO NOTHING;

-- Step 2: Create a database TRIGGER so profiles are ALWAYS auto-created on signup
-- This removes the fragile client-side insert entirely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, preferred_language, onboarding_complete)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'PATIENT'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- If role is PATIENT, also create the patient record
  IF COALESCE((NEW.raw_user_meta_data->>'role'), 'PATIENT') = 'PATIENT' THEN
    INSERT INTO public.patients (profile_id, difficulty_level)
    VALUES (NEW.id, 3)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Fix ALL RLS policies to be complete and correct

-- Drop all old conflicting policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate clean policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Fix patients policies
DROP POLICY IF EXISTS "Patients view own data" ON patients;
DROP POLICY IF EXISTS "Users can insert own patient record" ON patients;
DROP POLICY IF EXISTS "Caregivers view assigned patients" ON patients;
DROP POLICY IF EXISTS "ASHAs view assigned patients" ON patients;
DROP POLICY IF EXISTS "Caregivers update assigned patients" ON patients;

CREATE POLICY "Patients view own data" ON patients
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own patient record" ON patients
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Caregivers view assigned patients" ON patients
  FOR SELECT USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers update assigned patients" ON patients
  FOR UPDATE USING (auth.uid() = caregiver_id);

CREATE POLICY "ASHAs view assigned patients" ON patients
  FOR SELECT USING (auth.uid() = asha_id);

CREATE POLICY "ASHAs update assigned patients" ON patients
  FOR UPDATE USING (auth.uid() = asha_id);

-- Fix ASHA observations policies
DROP POLICY IF EXISTS "ASHAs manage observations" ON asha_observations;
DROP POLICY IF EXISTS "ASHAs can insert observations" ON asha_observations;
DROP POLICY IF EXISTS "Caregivers view observations" ON asha_observations;
DROP POLICY IF EXISTS "Caregivers view ASHA observations" ON asha_observations;

CREATE POLICY "ASHAs can insert observations" ON asha_observations
  FOR INSERT WITH CHECK (asha_id = auth.uid());

CREATE POLICY "ASHAs can view own observations" ON asha_observations
  FOR SELECT USING (asha_id = auth.uid());

CREATE POLICY "Caregivers view ASHA observations" ON asha_observations
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE caregiver_id = auth.uid())
  );

-- Step 4: Grant proper API permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Step 5: Add missing columns safely
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phc_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 6: Confirm success
SELECT 'Database fix complete!' as status;
