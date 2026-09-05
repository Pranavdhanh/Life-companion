'use client'

import { Languages } from 'lucide-react'
import { useToast } from './ui/Toast'
import { useLanguage } from '@/lib/i18n'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const { toast } = useToast()
  
  const languages: Array<'English' | 'Assamese' | 'Bengali' | 'Hindi'> = ['English', 'Assamese', 'Bengali', 'Hindi']

  const toggleLang = () => {
    const currentIndex = languages.indexOf(language)
    const nextLang = languages[(currentIndex + 1) % languages.length]
    setLanguage(nextLang)
    
    toast(`Language switched to ${nextLang}`, 'info')
  }

  return (
    <button 
      onClick={toggleLang}
      className="fixed bottom-24 right-4 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 z-50 group"
      aria-label="Toggle Language"
    >
      <Languages size={24} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2 font-bold text-sm">
        {language}
      </span>
    </button>
  )
}
