-- Run this in your Supabase SQL Editor to update the linking function

CREATE OR REPLACE FUNCTION public.link_patient_by_email(patient_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile_id UUID;
  target_patient_id UUID;
  caller_role TEXT;
BEGIN
  -- Find the target user by email in auth.users
  SELECT id INTO target_profile_id FROM auth.users WHERE email = patient_email LIMIT 1;

  IF target_profile_id IS NULL THEN
    RAISE EXCEPTION 'No account found with this email';
  END IF;
  
  -- Ensure the target is actually a patient
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_profile_id AND role = 'PATIENT') THEN
    RAISE EXCEPTION 'This account is not a registered patient';
  END IF;

  -- Find the patient record
  SELECT id INTO target_patient_id FROM public.patients WHERE profile_id = target_profile_id;

  IF target_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient profile is incomplete';
  END IF;

  -- Verify the caller is allowed to link (Caregiver or Admin)
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('CAREGIVER', 'ADMIN') THEN
    RAISE EXCEPTION 'Only caregivers can link patients this way (Your role is %)', caller_role;
  END IF;

  -- Update the patient record to link them to this caregiver
  UPDATE public.patients SET caregiver_id = auth.uid() WHERE id = target_patient_id;

  RETURN TRUE;
END;
$$;

-- Ensure authenticated users can execute this function
GRANT EXECUTE ON FUNCTION public.link_patient_by_email TO authenticated;
