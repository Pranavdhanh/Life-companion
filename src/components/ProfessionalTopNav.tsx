'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TopNavProps {
  title: string;
  role: 'CAREGIVER' | 'ASHA' | 'ADMIN';
}

export function ProfessionalTopNav({ title, role }: TopNavProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="sticky top-0 w-full bg-white border-b shadow-sm z-40 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-bold text-blue-600 text-lg hidden sm:block">Life Companion</span>
        <span className="text-gray-400 hidden sm:block">|</span>
        <h1 className="font-semibold text-gray-800">{title}</h1>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">{role}</span>
      </div>
      
      <button 
        onClick={handleLogout}
        className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors bg-red-50 px-3 py-1.5 rounded-md"
        aria-label="Logout"
      >
        Logout
      </button>
    </div>
  );
}
