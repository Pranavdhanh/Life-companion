-- ============================================================
-- LIFE COMPANION — ASHA & CAREGIVER VISIBILITY FIX
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow authenticated users to view profiles (Needed for ASHA/Caregiver to see names)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Ensure ASHA workers can view patients assigned to them
DROP POLICY IF EXISTS "ASHAs view assigned patients" ON public.patients;
CREATE POLICY "ASHAs view assigned patients" ON public.patients
  FOR SELECT USING (asha_id = auth.uid());

-- 3. Ensure Caregivers can view patients assigned to them
DROP POLICY IF EXISTS "Caregivers view assigned patients" ON public.patients;
CREATE POLICY "Caregivers view assigned patients" ON public.patients
  FOR SELECT USING (caregiver_id = auth.uid());

-- 4. Ensure ASHA workers can view game sessions for their patients
DROP POLICY IF EXISTS "ASHAs view assigned patient games" ON public.game_sessions;
CREATE POLICY "ASHAs view assigned patient games" ON public.game_sessions
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE asha_id = auth.uid())
  );

-- 5. Ensure ASHA workers can view life story events for their patients
DROP POLICY IF EXISTS "ASHAs view assigned patient life story" ON public.life_story_events;
CREATE POLICY "ASHAs view assigned patient life story" ON public.life_story_events
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE asha_id = auth.uid())
  );

-- 6. Ensure ASHA workers can view observations for their patients
DROP POLICY IF EXISTS "ASHAs view patient observations" ON public.asha_observations;
CREATE POLICY "ASHAs view patient observations" ON public.asha_observations
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE asha_id = auth.uid())
  );

-- 7. Ensure Caregivers can view observations for their patients
DROP POLICY IF EXISTS "Caregivers view ASHA observations" ON public.asha_observations;
CREATE POLICY "Caregivers view ASHA observations" ON public.asha_observations
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE caregiver_id = auth.uid())
  );

-- 8. Give Admins UPDATE access to patients (Fixes fallback in Admin Dashboard)
DROP POLICY IF EXISTS "Admins can update patients" ON public.patients;
CREATE POLICY "Admins can update patients" ON public.patients
  FOR UPDATE USING ( public.is_admin() );

-- Verify that RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_story_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asha_observations ENABLE ROW LEVEL SECURITY;
