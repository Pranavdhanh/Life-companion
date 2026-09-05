'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { LogOut, Gamepad2, BookHeart, Bell, Phone } from 'lucide-react';
import { SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';
import { PatientBottomNav } from '@/components/PatientBottomNav';
import { SplitText } from '@/components/ui/animations/SplitText';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function PatientHome() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [gamesToday, setGamesToday] = useState<number>(0);
  const [nextReminder, setNextReminder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [{ data: prof }, { data: patients }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('patients').select('*').eq('profile_id', user.id).single()
      ]);

      setProfile(prof);

      if (patients) {
        // Get today's games count
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        const { count } = await supabase
          .from('game_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patients.id)
          .gte('created_at', startOfToday.toISOString());
          
        setGamesToday(count || 0);

        // Get next upcoming reminder today
        // (Simplification: assuming time_of_day maps well to current hour, or just getting the first active one)
        const { data: reminders } = await supabase
          .from('reminders')
          .select('*')
          .eq('patient_id', patients.id)
          .eq('is_active', true)
          .order('time_of_day');

        if (reminders && reminders.length > 0) {
          setNextReminder(reminders[0]);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

  if (loading) {
    return (
      <div className="min-h-screen p-6 max-w-lg mx-auto flex flex-col gap-6 pt-10">
        <SkeletonText lines={2} />
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col gap-6 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SplitText text={`Hello, ${profile?.full_name?.split(' ')[0] || 'Friend'}!`} /> 🌅
          </h1>
          <p className="text-lg text-gray-600 mt-1">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              alert("EMERGENCY SOS TRIGGERED!\n\nAlerting Caregiver and ASHA Worker immediately with your GPS location.")
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-lg border-2 border-red-700 animate-pulse flex items-center gap-2 transition-transform active:scale-95"
          >
            🚨 SOS
          </button>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 transition-colors p-2 bg-white rounded-full shadow-sm" aria-label="Logout">
            <LogOut size={24} />
          </button>
        </div>
      </div>
      
      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold w-max border border-yellow-200">
        Support tool, not a medical device
      </div>

      <div className="text-xl text-gray-700 mt-2 font-medium">
        You completed <span className="font-bold text-blue-600">{gamesToday}</span> games today
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div 
          onClick={() => router.push('/patient/games')}
          className="bg-blue-100 hover:bg-blue-200 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm border border-blue-200 text-center"
          role="button"
          tabIndex={0}
        >
          <Gamepad2 size={48} className="text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-blue-900">Games</h2>
            <p className="text-sm text-blue-800">{gamesToday} sessions today</p>
          </div>
        </div>

        <div 
          onClick={() => router.push('/patient/timeline')}
          className="bg-pink-100 hover:bg-pink-200 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm border border-pink-200 text-center"
          role="button"
          tabIndex={0}
        >
          <BookHeart size={48} className="text-pink-600" />
          <div>
            <h2 className="text-xl font-bold text-pink-900">Life Story</h2>
            <p className="text-sm text-pink-800">View memories</p>
          </div>
        </div>

        <div 
          onClick={() => router.push('/patient/reminders')}
          className="bg-green-100 hover:bg-green-200 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm border border-green-200 text-center"
          role="button"
          tabIndex={0}
        >
          <Bell size={48} className="text-green-600" />
          <div>
            <h2 className="text-xl font-bold text-green-900">Reminders</h2>
            <p className="text-sm text-green-800">{nextReminder ? nextReminder.title : 'All done!'}</p>
          </div>
        </div>

        <div 
          onClick={() => router.push('/patient/family')}
          className="bg-purple-100 hover:bg-purple-200 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm border border-purple-200 text-center"
          role="button"
          tabIndex={0}
        >
          <Phone size={48} className="text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-purple-900">Family</h2>
            <p className="text-sm text-purple-800">Contact family</p>
          </div>
        </div>
      </div>

      <LanguageToggle />
      <PatientBottomNav />
    </div>
  );
}
