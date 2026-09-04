-- Create Enums
CREATE TYPE user_role AS ENUM ('PATIENT', 'CAREGIVER', 'ASHA', 'ADMIN');
CREATE TYPE time_period AS ENUM ('CHILDHOOD', 'YOUTH', 'WORK', 'FAMILY', 'LATER');
CREATE TYPE event_type AS ENUM ('PHOTO', 'VOICE', 'TEXT');
CREATE TYPE game_type AS ENUM ('WHO_PHOTO', 'WHICH_FESTIVAL', 'VOICE_RECALL', 'MARKET_RECALL');
CREATE TYPE weather_status AS ENUM ('SUNNY', 'CLOUDY', 'RAINY', 'STORM');

-- Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'PATIENT',
  full_name TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  asha_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  difficulty_level INT DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Life Story Events Table
CREATE TABLE life_story_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  time_period time_period NOT NULL,
  event_type event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  festival_tag TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Game Sessions Table
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  game_type game_type NOT NULL,
  accuracy FLOAT NOT NULL,
  response_time_ms INT NOT NULL,
  difficulty_level INT NOT NULL,
  p_score FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reminders Table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  time_of_day TEXT NOT NULL, -- e.g. '09:00'
  is_active BOOLEAN DEFAULT true,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ASHA Observations Table
CREATE TABLE asha_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  asha_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  mood_rating INT,
  engagement_level INT,
  missed_meds INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_story_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asha_observations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Patients: Patients can view themselves; Caregivers/ASHAs can view/update assigned patients
CREATE POLICY "Patients view own data" ON patients FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Caregivers view assigned patients" ON patients FOR SELECT USING (auth.uid() = caregiver_id);
CREATE POLICY "ASHAs view assigned patients" ON patients FOR SELECT USING (auth.uid() = asha_id);
CREATE POLICY "Caregivers update assigned patients" ON patients FOR UPDATE USING (auth.uid() = caregiver_id);

-- Life Story Events: Patients read own; Caregivers/ASHAs read/write assigned
CREATE POLICY "Patients view own events" ON life_story_events FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);
CREATE POLICY "Caregivers manage events" ON life_story_events FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE caregiver_id = auth.uid())
);
CREATE POLICY "ASHAs manage events" ON life_story_events FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE asha_id = auth.uid())
);

-- Game Sessions
CREATE POLICY "Patients view own sessions" ON game_sessions FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);
CREATE POLICY "Patients insert own sessions" ON game_sessions FOR INSERT WITH CHECK (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);
CREATE POLICY "Caregivers view sessions" ON game_sessions FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE caregiver_id = auth.uid())
);
CREATE POLICY "ASHAs view/insert sessions" ON game_sessions FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE asha_id = auth.uid())
);

-- Reminders
CREATE POLICY "Patients view own reminders" ON reminders FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
);
CREATE POLICY "Caregivers manage reminders" ON reminders FOR ALL USING (
  patient_id IN (SELECT id FROM patients WHERE caregiver_id = auth.uid())
);

-- ASHA Observations
CREATE POLICY "ASHAs manage observations" ON asha_observations FOR ALL USING (asha_id = auth.uid());
CREATE POLICY "Caregivers view observations" ON asha_observations FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE caregiver_id = auth.uid())
);
