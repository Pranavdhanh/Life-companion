'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { PatientBottomNav } from '@/components/PatientBottomNav';

export default function PatientTimeline() {
  const supabase = createClient();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: patient } = await supabase.from('patients').select('id').eq('profile_id', user.id).single();
      if (patient) {
        const { data } = await supabase
          .from('life_story_events')
          .select('*')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false });
        
        if (data) setEvents(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const periods = ['CHILDHOOD', 'YOUTH', 'WORK', 'FAMILY', 'LATER'];
  
  const groupedEvents = periods.map(period => ({
    period,
    items: events.filter(e => e.time_period === period)
  })).filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col gap-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">My Life Story 📖</h1>
      
      {loading ? (
        <SkeletonList count={5} />
      ) : events.length === 0 ? (
        <div className="text-center text-xl text-gray-500 mt-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          Your life story is waiting to be written! Ask your caregiver to add your first memory.
        </div>
      ) : (
        <div className="flex flex-col gap-8 relative border-l-4 border-pink-200 ml-4 pl-6">
          {groupedEvents.map(group => (
            <div key={group.period} className="relative">
              <div className="absolute -left-[40px] top-1 bg-pink-500 text-white w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center"></div>
              <h2 className="text-2xl font-bold text-pink-700 mb-4">{group.period}</h2>
              <div className="flex flex-col gap-4">
                {group.items.map(event => (
                  <Card key={event.id} className="p-5 overflow-hidden rounded-2xl shadow-md border-0 bg-white">
                    {event.event_type === 'PHOTO' && event.media_url && (
                      <div className="-mx-5 -mt-5 mb-4 relative h-48 bg-gray-100">
                        <img src={event.media_url} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
                    {event.description && <p className="text-lg text-gray-700">{event.description}</p>}
                    
                    {event.event_type === 'VOICE' && event.media_url && (
                      <div className="mt-4">
                        <audio controls className="w-full" src={event.media_url}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PatientBottomNav />
    </div>
  );
}
