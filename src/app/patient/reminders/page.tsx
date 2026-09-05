'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { PatientBottomNav } from '@/components/PatientBottomNav';
import { Volume2 } from 'lucide-react';

export default function PatientReminders() {
  const supabase = createClient();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patient } = await supabase.from('patients').select('id').eq('profile_id', user.id).single();
      if (patient) {
        const { data } = await supabase
          .from('reminders')
          .select('*')
          .eq('patient_id', patient.id)
          .eq('is_active', true)
          .order('time_of_day');
        
        if (data) setReminders(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const grouped = {
    Morning: reminders.filter(r => r.time_of_day === 'MORNING'),
    Afternoon: reminders.filter(r => r.time_of_day === 'AFTERNOON'),
    Evening: reminders.filter(r => r.time_of_day === 'EVENING'),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col gap-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">My Reminders 🔔</h1>
      
      {loading ? (
        <SkeletonList count={4} />
      ) : reminders.length === 0 ? (
        <div className="text-center text-xl text-gray-500 mt-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          No reminders set yet. Ask your caregiver to add some!
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([timeOfDay, rems]) => {
            if (rems.length === 0) return null;
            return (
              <div key={timeOfDay}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">{timeOfDay}</h2>
                <div className="flex flex-col gap-4">
                  {rems.map(r => (
                    <Card key={r.id} className="p-5 flex justify-between items-center shadow-md bg-white rounded-2xl border-l-8 border-green-500">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{r.title}</h3>
                        <p className="text-lg text-gray-600 mt-1">{r.time_of_day}</p>
                      </div>
                      <button 
                        onClick={() => speak(r.title)}
                        className="bg-green-100 p-4 rounded-full text-green-700 hover:bg-green-200 transition-colors"
                        aria-label={`Read out ${r.title}`}
                      >
                        <Volume2 size={32} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PatientBottomNav />
    </div>
  );
}
