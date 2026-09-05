-- Run this in your Supabase SQL Editor to fix the registration loop

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to insert their own patient record during registration
CREATE POLICY "Users can insert own patient record" ON patients 
FOR INSERT WITH CHECK (profile_id = auth.uid());
