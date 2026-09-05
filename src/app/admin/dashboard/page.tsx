'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProfessionalTopNav } from '@/components/ProfessionalTopNav';
import { Card } from '@/components/ui/Card';
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { Search } from 'lucide-react';

export default function AdminDashboard() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    caregivers: 0,
    ashas: 0,
    sessions: 0
  });

  const [activeTab, setActiveTab] = useState<'PATIENT' | 'CAREGIVER' | 'ASHA'>('PATIENT');
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // For ASHA assignment
  const [ashasList, setAshasList] = useState<any[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchAshasList();
  }, [supabase]);

  useEffect(() => {
    fetchUsers(activeTab);
  }, [supabase, activeTab]);

  const fetchStats = async () => {
    const [{ count: pCount }, { count: cCount }, { count: aCount }, { count: sCount }] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CAREGIVER'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ASHA'),
      supabase.from('game_sessions').select('*', { count: 'exact', head: true })
    ]);

    setStats({
      patients: pCount || 0,
      caregivers: cCount || 0,
      ashas: aCount || 0,
      sessions: sCount || 0
    });
  };

  const fetchAshasList = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'ASHA');
    if (data) setAshasList(data);
  };

  const fetchUsers = async (role: string) => {
    setLoading(true);
    let query = supabase.from('profiles').select('*, patients(asha_id)').eq('role', role).order('created_at', { ascending: false });
    const { data } = await query;
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleAssignAsha = async (patientProfileId: string, ashaId: string) => {
    setAssigningId(patientProfileId);
    
    // Admins don't have direct RLS update access to patients in our current setup, 
    // but they can use the RPC function we will create.
    const { error } = await supabase.rpc('admin_assign_asha', {
      p_profile_id: patientProfileId,
      p_asha_id: ashaId === '' ? null : ashaId
    });

    if (error) {
      // Fallback if RPC isn't created yet, try direct update
      const { error: directError } = await supabase
        .from('patients')
        .update({ asha_id: ashaId === '' ? null : ashaId })
        .eq('profile_id', patientProfileId);
        
      if (directError) {
        toast('Failed to assign. Please run the SQL fix script.', 'error');
        setAssigningId(null);
        return;
      }
    }
    
    toast('ASHA worker assigned successfully', 'success');
    
    // Update local state to reflect change without full reload
    setUsers(users.map(u => {
      if (u.id === patientProfileId) {
        return {
          ...u,
          patients: u.patients && u.patients.length > 0 
            ? [{ ...u.patients[0], asha_id: ashaId === '' ? null : ashaId }] 
            : [{ asha_id: ashaId === '' ? null : ashaId }]
        };
      }
      return u;
    }));
    
    setAssigningId(null);
  };

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      <ProfessionalTopNav title="Admin Dashboard" role="ADMIN" />
      
      <div className="p-6 max-w-6xl mx-auto w-full flex-1 space-y-8">
        <Alert variant="info" message="Admin actions directly modify the database. Exercise caution." />

        <div>
          <h2 className="text-xl font-bold mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 text-center">
              <p className="text-gray-500 text-sm">Total Patients</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.patients}</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-gray-500 text-sm">Total Caregivers</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.caregivers}</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-gray-500 text-sm">Total ASHA Workers</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.ashas}</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-gray-500 text-sm">Game Sessions</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.sessions}</p>
            </Card>
          </div>
        </div>

        <Card className="bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 flex">
            {[
              { id: 'PATIENT', label: 'Patients' },
              { id: 'CAREGIVER', label: 'Caregivers' },
              { id: 'ASHA', label: 'ASHA Workers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearch(''); }}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-b flex justify-between items-center">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab.toLowerCase()}s by name...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6"><SkeletonList count={5} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">User ID / Phone</th>
                    <th className="p-4 font-medium">Created At</th>
                    {activeTab === 'PATIENT' && <th className="p-4 font-medium">Assigned ASHA</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, idx) => (
                      <tr key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-4 font-medium text-gray-900">{user.full_name || 'N/A'}</td>
                        <td className="p-4">
                          <div className="text-gray-500 text-xs font-mono mb-1">{user.id}</div>
                          <div className="text-gray-700 text-sm">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="p-4 text-gray-600 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                        
                        {activeTab === 'PATIENT' && (
                          <td className="p-4">
                            <select
                              disabled={assigningId === user.id}
                              value={user.patients && user.patients.length > 0 ? (user.patients[0].asha_id || '') : ''}
                              onChange={(e) => handleAssignAsha(user.id, e.target.value)}
                              className="w-full max-w-xs border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 bg-white"
                            >
                              <option value="">-- Unassigned --</option>
                              {ashasList.map(asha => (
                                <option key={asha.id} value={asha.id}>
                                  {asha.full_name || 'Unnamed ASHA'}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeTab === 'PATIENT' ? 4 : 3} className="p-8 text-center text-gray-500">
                        No {activeTab.toLowerCase()}s found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
