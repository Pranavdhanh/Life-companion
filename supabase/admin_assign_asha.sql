-- ============================================================
-- LIFE COMPANION — ASHA ASSIGNMENT FIX
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create a secure function for admins to assign ASHA workers to patients
CREATE OR REPLACE FUNCTION public.admin_assign_asha(
  p_profile_id UUID,
  p_asha_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is an ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Not authorized. Only admins can assign ASHA workers.';
  END IF;

  -- Update the patient record
  UPDATE patients 
  SET asha_id = p_asha_id
  WHERE profile_id = p_profile_id;
END;
$$;

-- Grant execution to authenticated users (function internally verifies admin status)
GRANT EXECUTE ON FUNCTION public.admin_assign_asha TO authenticated;
