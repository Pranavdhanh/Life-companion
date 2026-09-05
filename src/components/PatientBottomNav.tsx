'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

export function PatientBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    { href: '/patient/home', label: t.navHome, icon: '🏠' },
    { href: '/patient/games', label: t.navGames, icon: '🎮' },
    { href: '/patient/timeline', label: t.navLifeStory, icon: '📖' },
    { href: '/patient/reminders', label: t.navReminders, icon: '🔔' }
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {links.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <span className="text-2xl mb-1">{link.icon}</span>
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
