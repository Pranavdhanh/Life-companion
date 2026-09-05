'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProfessionalTopNav } from '@/components/ProfessionalTopNav';
import { Card } from '@/components/ui/Card';
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import { CognitiveWeatherMap } from '@/components/CognitiveWeatherMap';
import { RemindersManager } from '@/components/RemindersManager';
import { LifeStoryBuilder } from '@/components/LifeStoryBuilder';
import { LinkPatientForm } from '@/components/LinkPatientForm';
import { useToast } from '@/components/ui/Toast';

export default function CaregiverDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'lifestory' | 'reminders'>('overview');
  
  // Dashboard stats
  const [stats, setStats] = useState({
    gamesThisWeek: 0,
    totalSessions: 0,
    avgScore: 0,
    lastActive: '-'
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  
  // Life story stats
  const [lifeStoryEvents, setLifeStoryEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('patients').select('*, profiles!patients_profile_id_fkey(full_name)').eq('caregiver_id', user.id).single();
      
      if (p) {
        setPatient(p);

        // Fetch Overview data
        const { data: sessions } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('patient_id', p.id)
          .order('created_at', { ascending: false });

        if (sessions) {
          setRecentSessions(sessions.slice(0, 5));
          
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const weekSessions = sessions.filter(s => new Date(s.created_at) >= oneWeekAgo);
          const totalScore = sessions.reduce((acc, s) => acc + (s.p_score || 0), 0);
          
          setStats({
            gamesThisWeek: weekSessions.length,
            totalSessions: sessions.length,
            avgScore: sessions.length ? Math.round(totalScore / sessions.length) : 0,
            lastActive: sessions.length ? new Date(sessions[0].created_at).toLocaleDateString() : '-'
          });
        }

        // Fetch Life Story data
        const { data: events } = await supabase
          .from('life_story_events')
          .select('*')
          .eq('patient_id', p.id)
          .order('created_at', { ascending: false });
          
        if (events) {
          setLifeStoryEvents(events);
        }
      }
      setLoading(false);
    };
    
    fetchDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ProfessionalTopNav title="Caregiver Dashboard" role="CAREGIVER" />
        <div className="p-6 max-w-4xl mx-auto w-full flex-1">
          <SkeletonCard />
          <div className="mt-4"><SkeletonList count={3} /></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ProfessionalTopNav title="Caregiver Dashboard" role="CAREGIVER" />
        <div className="p-6 max-w-md mx-auto w-full mt-10">
          <Card className="p-6 text-center shadow-md">
            <h2 className="text-xl font-bold mb-4">Welcome to Life Companion</h2>
            <p className="text-gray-600 mb-6">Link a patient to start managing their care.</p>
            <LinkPatientForm onLinked={() => window.location.reload()} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      <ProfessionalTopNav title={`Caregiver: ${patient.profiles?.full_name || 'Patient'}`} role="CAREGIVER" />
      
      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-5xl mx-auto flex">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'lifestory', label: 'Life Story' },
            { id: 'reminders', label: 'Reminders' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full flex-1">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">Overview</h2>
              <button 
                onClick={() => {
                  toast("Compiling P-Score metrics and cognitive weather map into PDF...", "info")
                  setTimeout(() => window.print(), 1000)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2"
              >
                📄 Export Doctor's Report
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border border-gray-100 shadow-sm text-center">
                <p className="text-sm text-gray-500">Games this week</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.gamesThisWeek}</p>
              </Card>
              <Card className="p-4 bg-white border border-gray-100 shadow-sm text-center">
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalSessions}</p>
              </Card>
              <Card className="p-4 bg-white border border-gray-100 shadow-sm text-center">
                <p className="text-sm text-gray-500">Avg P-Score</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.avgScore}</p>
              </Card>
              <Card className="p-4 bg-white border border-gray-100 shadow-sm text-center">
                <p className="text-sm text-gray-500">Last Active</p>
                <p className="text-xl font-bold text-gray-800 mt-2">{stats.lastActive}</p>
              </Card>
            </div>

            <Card className="p-6 bg-white shadow-sm">
              <h3 className="text-lg font-bold mb-4">Cognitive Weather Map</h3>
              <CognitiveWeatherMap patientId={patient.id} />
            </Card>

            <Card className="p-6 bg-white shadow-sm">
              <h3 className="text-lg font-bold mb-4">Recent Game Sessions</h3>
              {recentSessions.length > 0 ? (
                <div className="divide-y">
                  {recentSessions.map(session => (
                    <div key={session.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{session.game_type}</p>
                        <p className="text-sm text-gray-500">{new Date(session.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          Score: {session.p_score || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No game sessions recorded yet.</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'lifestory' && (
          <div className="space-y-6">
            <Card className="p-6 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Life Story Events ({lifeStoryEvents.length})</h3>
              </div>
              
              {lifeStoryEvents.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {lifeStoryEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                      {event.event_type === 'PHOTO' && event.media_url ? (
                        <img src={event.media_url} alt="thumbnail" className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded flex items-center justify-center font-bold text-xl">
                          {event.event_type === 'VOICE' ? '🎤' : '📝'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{event.time_period}</p>
                      </div>
                    </div>
                  ))}
                  {lifeStoryEvents.length > 5 && (
                    <p className="text-sm text-center text-gray-500">Showing 5 most recent events.</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 mb-8">No life story events added yet.</p>
              )}

              <div className="border-t pt-6">
                <LifeStoryBuilder patientId={patient.id} onEventCreated={() => window.location.reload()} />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reminders' && (
          <RemindersManager patientId={patient.id} />
        )}
      </div>
    </div>
  );
}
