-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION link_patient_by_email(patient_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_profile_id UUID;
  target_patient_id UUID;
BEGIN
  -- Note: auth.users is highly restricted. We need a way to look up users by email.
  -- Alternatively, we can store 'email' in the 'profiles' table when they register.
  
  -- Since we didn't store email in profiles, we can look it up in auth.users because
  -- SECURITY DEFINER runs as a Postgres superuser and bypasses RLS.
  SELECT id INTO target_profile_id FROM auth.users WHERE email = patient_email LIMIT 1;

  IF target_profile_id IS NULL THEN
    RAISE EXCEPTION 'No account found with this email';
  END IF;
  
  -- Ensure they are actually a patient
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_profile_id AND role = 'PATIENT') THEN
    RAISE EXCEPTION 'This account is not a registered patient';
  END IF;

  -- Find the patient record
  SELECT id INTO target_patient_id FROM patients WHERE profile_id = target_profile_id;

  IF target_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient profile is incomplete';
  END IF;

  -- Ensure the caller is a caregiver (optional, but good practice)
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'CAREGIVER') THEN
    RAISE EXCEPTION 'Only caregivers can link patients this way';
  END IF;

  -- Update the patient record
  UPDATE patients SET caregiver_id = auth.uid() WHERE id = target_patient_id;

  RETURN TRUE;
END;
$$;
