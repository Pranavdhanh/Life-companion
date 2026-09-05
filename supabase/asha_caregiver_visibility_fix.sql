-- ============================================================
-- FIX: Caregivers and ASHA workers missing RLS to view patient profiles
-- ============================================================

-- 1. Policy for Caregivers to view profiles of their assigned patients
DROP POLICY IF EXISTS "Caregivers can view patient profiles" ON public.profiles;
CREATE POLICY "Caregivers can view patient profiles" ON public.profiles
  FOR SELECT USING (
    id IN (SELECT profile_id FROM public.patients WHERE caregiver_id = auth.uid())
  );

-- 2. Policy for ASHA workers to view profiles of their assigned patients
DROP POLICY IF EXISTS "ASHAs can view patient profiles" ON public.profiles;
CREATE POLICY "ASHAs can view patient profiles" ON public.profiles
  FOR SELECT USING (
    id IN (SELECT profile_id FROM public.patients WHERE asha_id = auth.uid())
  );

-- 3. Just in case, let's also allow Caregivers and ASHAs to view Game Sessions and Life Story Events of their patients
DROP POLICY IF EXISTS "ASHAs view assigned patient games" ON public.game_sessions;
CREATE POLICY "ASHAs view assigned patient games" ON public.game_sessions
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE asha_id = auth.uid())
  );

DROP POLICY IF EXISTS "ASHAs view assigned patient life story" ON public.life_story_events;
CREATE POLICY "ASHAs view assigned patient life story" ON public.life_story_events
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE asha_id = auth.uid())
  );
  
DROP POLICY IF EXISTS "Caregivers view assigned patient life story" ON public.life_story_events;
CREATE POLICY "Caregivers view assigned patient life story" ON public.life_story_events
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE caregiver_id = auth.uid())
  );

-- Add same for Reminders
DROP POLICY IF EXISTS "ASHAs view assigned patient reminders" ON public.reminders;
CREATE POLICY "ASHAs view assigned patient reminders" ON public.reminders
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE asha_id = auth.uid())
  );

DROP POLICY IF EXISTS "Caregivers view assigned patient reminders" ON public.reminders;
CREATE POLICY "Caregivers view assigned patient reminders" ON public.reminders
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.patients WHERE caregiver_id = auth.uid())
  );
