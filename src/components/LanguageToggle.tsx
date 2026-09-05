'use client'

import { useState } from 'react'
import { Languages } from 'lucide-react'
import { useToast } from './ui/Toast'

export function LanguageToggle() {
  const [lang, setLang] = useState('English')
  const { toast } = useToast()
  
  const languages = ['English', 'Assamese (অসমীয়া)', 'Bengali (বাংলা)', 'Hindi (हिंदी)', 'Mizo']

  const toggleLang = () => {
    const currentIndex = languages.indexOf(lang)
    const nextLang = languages[(currentIndex + 1) % languages.length]
    setLang(nextLang)
    
    toast(`Language switched to ${nextLang} (Simulated for SIH)`, 'info')
  }

  return (
    <button 
      onClick={toggleLang}
      className="fixed bottom-24 right-4 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 z-50 group"
      aria-label="Toggle Language"
    >
      <Languages size={24} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2 font-bold text-sm">
        {lang}
      </span>
    </button>
  )
}
