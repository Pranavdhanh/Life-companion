'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProfessionalTopNav } from '@/components/ProfessionalTopNav';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { CognitiveWeatherMap } from '@/components/CognitiveWeatherMap';
import { useToast } from '@/components/ui/Toast';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react';

export default function AshaDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [view, setView] = useState<'list' | 'detail' | 'observation'>('list');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [lifeStory, setLifeStory] = useState<any[]>([]);

  // Form State
  const [moodRating, setMoodRating] = useState(3);
  const [engagementLevel, setEngagementLevel] = useState(3);
  const [missedMeds, setMissedMeds] = useState(0);
  const [notes, setNotes] = useState('');

  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    fetchPatients();
    checkUnsynced();
  }, [supabase]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('patients')
      .select('*, profiles!patients_profile_id_fkey(full_name, phone)')
      .eq('asha_id', user.id);
      
    if (data) setPatients(data);
    setLoading(false);
  };

  const checkUnsynced = () => {
    const queue = JSON.parse(localStorage.getItem('unsyncedObservations') || '[]');
    setUnsyncedCount(queue.length);
  };

  const syncOffline = async () => {
    if (!navigator.onLine) {
      toast('Still offline', 'error');
      return;
    }
    
    const queue = JSON.parse(localStorage.getItem('unsyncedObservations') || '[]');
    if (queue.length === 0) return;

    let successCount = 0;
    for (const obs of queue) {
      const { error } = await supabase.from('asha_observations').insert(obs);
      if (!error) successCount++;
    }

    localStorage.setItem('unsyncedObservations', '[]');
    setUnsyncedCount(0);
    toast(`Synced ${successCount} observations`, 'success');
  };

  const handlePatientSelect = async (patient: any) => {
    setSelectedPatient(patient);
    setView('detail');
    
    // Fetch recent observations
    const { data: obs } = await supabase
      .from('asha_observations')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(3);
    if (obs) setObservations(obs);
  };

  const fetchLifeStory = async () => {
    const { data } = await supabase
      .from('life_story_events')
      .select('*')
      .eq('patient_id', selectedPatient.id)
      .order('created_at', { ascending: false });
    if (data) setLifeStory(data);
  };

  const submitObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const obs = {
      patient_id: selectedPatient.id,
      asha_id: user.id,
      mood_rating: moodRating,
      engagement_level: engagementLevel,
      missed_meds: missedMeds,
      notes
    };

    if (navigator.onLine) {
      const { error } = await supabase.from('asha_observations').insert(obs);
      if (error) {
        toast('Error saving observation', 'error');
      } else {
        toast('Observation saved', 'success');
        setView('detail');
        handlePatientSelect(selectedPatient); // refresh
      }
    } else {
      const queue = JSON.parse(localStorage.getItem('unsyncedObservations') || '[]');
      queue.push(obs);
      localStorage.setItem('unsyncedObservations', JSON.stringify(queue));
      setUnsyncedCount(queue.length);
      toast('Saved offline. Will sync when connected.', 'warning');
      setView('detail');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProfessionalTopNav title="ASHA Dashboard" role="ASHA" />
      
      {unsyncedCount > 0 && (
        <div className="bg-blue-600 text-white p-3 flex justify-between items-center z-20">
          <span>{unsyncedCount} unsynced records</span>
          <button onClick={syncOffline} className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-bold hover:bg-blue-50">
            Sync Now
          </button>
        </div>
      )}

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-6">
        {view === 'list' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search patients..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            {loading ? (
              <SkeletonList count={4} />
            ) : filteredPatients.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg border text-gray-500">
                No patients found. Contact an admin to assign patients.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {filteredPatients.map(p => (
                  <Card 
                    key={p.id} 
                    className="p-4 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors bg-white shadow-sm"
                    onClick={() => handlePatientSelect(p)}
                  >
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{p.profiles?.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">Difficulty Level: <span className="font-medium text-gray-700">{p.difficulty_level || 1}</span></p>
                      <p className="text-xs text-gray-400 mt-1">Added: {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedPatient && (
          <div className="space-y-6">
            <button 
              onClick={() => setView('list')}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to patients
            </button>
            
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedPatient.profiles?.full_name}</h2>
                <p className="text-gray-600 mt-1">Phone: {selectedPatient.profiles?.phone || 'N/A'}</p>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                Level {selectedPatient.difficulty_level || 1}
              </div>
            </div>

            <Card className="p-5 bg-white shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-3">Cognitive Health Overview</h3>
              <CognitiveWeatherMap patientId={selectedPatient.id} />
            </Card>

            <div className="flex gap-4">
              <button 
                onClick={() => { setView('observation'); setNotes(''); setMissedMeds(0); setMoodRating(3); setEngagementLevel(3); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Add Observation
              </button>
              <button 
                onClick={fetchLifeStory}
                className="flex-1 bg-pink-100 hover:bg-pink-200 text-pink-700 py-3 rounded-lg font-medium transition-colors border border-pink-200"
              >
                View Life Story
              </button>
            </div>

            {lifeStory.length > 0 && (
              <Card className="p-5 bg-pink-50 border-pink-100 shadow-sm mt-4">
                <h3 className="font-bold text-lg mb-3 text-pink-900">Life Story Highlights</h3>
                <div className="space-y-3">
                  {lifeStory.slice(0, 3).map(event => (
                    <div key={event.id} className="bg-white p-3 rounded border border-pink-100">
                      <p className="font-bold">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.time_period}</p>
                    </div>
                  ))}
                  <p className="text-xs text-center text-pink-500 mt-2">Showing recent {Math.min(lifeStory.length, 3)} records</p>
                </div>
              </Card>
            )}

            <div>
              <h3 className="font-bold text-lg mb-3 mt-8">Recent Observations</h3>
              {observations.length > 0 ? (
                <div className="space-y-3">
                  {observations.map(obs => (
                    <Card key={obs.id} className="p-4 bg-white shadow-sm text-sm border-l-4 border-blue-500">
                      <div className="flex justify-between text-gray-500 mb-2">
                        <span>{new Date(obs.created_at).toLocaleDateString()}</span>
                        <span>Missed meds: {obs.missed_meds}</span>
                      </div>
                      <div className="flex gap-4 mb-2">
                        <span className="bg-gray-100 px-2 py-1 rounded">Mood: {obs.mood_rating}/5</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">Engagement: {obs.engagement_level}/5</span>
                      </div>
                      {obs.notes && <p className="text-gray-700 mt-2 bg-gray-50 p-2 rounded">{obs.notes}</p>}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg border text-center">No recent observations.</p>
              )}
            </div>
          </div>
        )}

        {view === 'observation' && selectedPatient && (
          <div className="space-y-6">
            <button 
              onClick={() => setView('detail')}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Cancel
            </button>
            
            <h2 className="text-2xl font-bold">New Observation</h2>
            <p className="text-gray-600">Patient: {selectedPatient.profiles?.full_name}</p>

            <form onSubmit={submitObservation} className="space-y-5 bg-white p-6 rounded-xl border shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mood Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button type="button" key={v} onClick={() => setMoodRating(v)} className={`flex-1 py-2 rounded border ${moodRating === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Level (1-5)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button type="button" key={v} onClick={() => setEngagementLevel(v)} className={`flex-1 py-2 rounded border ${engagementLevel === v ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Missed Medications Today</label>
                <input 
                  type="number" min="0" max="10" 
                  value={missedMeds} onChange={(e) => setMissedMeds(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                <textarea 
                  rows={4} 
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" 
                  placeholder="Note any behavioral changes, memory issues, or general health concerns..."
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                Save Observation
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
