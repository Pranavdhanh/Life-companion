'use client'

import React, { createContext, useContext, useState } from 'react'

type Language = 'English' | 'Assamese' | 'Bengali' | 'Hindi'

type Dictionary = {
  hello: string
  friend: string
  supportTool: string
  gamesCompleted: string
  gamesToday: string
  games: string
  sessionsToday: string
  lifeStory: string
  viewMemories: string
  reminders: string
  allDone: string
  family: string
  contactFamily: string
  logout: string
  sos: string
  navHome: string
  navGames: string
  navLifeStory: string
  navReminders: string
}

const dictionaries: Record<Language, Dictionary> = {
  English: {
    hello: "Hello",
    friend: "Friend",
    supportTool: "Support tool, not a medical device",
    gamesCompleted: "You completed",
    gamesToday: "games today",
    games: "Games",
    sessionsToday: "sessions today",
    lifeStory: "Life Story",
    viewMemories: "View memories",
    reminders: "Reminders",
    allDone: "All done!",
    family: "Family",
    contactFamily: "Contact family",
    logout: "Logout",
    sos: "SOS",
    navHome: "Home",
    navGames: "Games",
    navLifeStory: "Life Story",
    navReminders: "Reminders"
  },
  Assamese: {
    hello: "নমস্কাৰ",
    friend: "বন্ধু",
    supportTool: "সহায় সঁজুলি, চিকিৎসা সঁজুলি নহয়",
    gamesCompleted: "আপুনি আজি",
    gamesToday: "খন গেম খেলিছে",
    games: "গেমসমূহ",
    sessionsToday: "টা চেচন আজি",
    lifeStory: "জীৱন কাহিনী",
    viewMemories: "স্মৃতিবোৰ চাওক",
    reminders: "স্মাৰক",
    allDone: "সকলো সম্পূৰ্ণ!",
    family: "পৰিয়াল",
    contactFamily: "পৰিয়ালৰ সৈতে যোগাযোগ",
    logout: "লগ আউট",
    sos: "এছ অ' এছ",
    navHome: "মূল পৃষ্ঠা",
    navGames: "গেমসমূহ",
    navLifeStory: "জীৱন কাহিনী",
    navReminders: "স্মাৰক"
  },
  Bengali: {
    hello: "নমস্কার",
    friend: "বন্ধু",
    supportTool: "সহায়তা সরঞ্জাম, মেডিকেল ডিভাইস নয়",
    gamesCompleted: "আপনি আজ",
    gamesToday: "টি গেম খেলেছেন",
    games: "গেম",
    sessionsToday: "টি সেশন আজ",
    lifeStory: "জীবন কাহিনী",
    viewMemories: "স্মৃতি দেখুন",
    reminders: "রিমাইন্ডার",
    allDone: "সব শেষ!",
    family: "পরিবার",
    contactFamily: "যোগাযোগ করুন",
    logout: "লগআউট",
    sos: "এস ও এস",
    navHome: "বাড়ি",
    navGames: "গেম",
    navLifeStory: "জীবন কাহিনী",
    navReminders: "রিমাইন্ডার"
  },
  Hindi: {
    hello: "नमस्ते",
    friend: "दोस्त",
    supportTool: "सहायता उपकरण, चिकित्सा उपकरण नहीं",
    gamesCompleted: "आपने आज",
    gamesToday: "गेम पूरे किए",
    games: "गेम्स",
    sessionsToday: "सत्र आज",
    lifeStory: "जीवन कहानी",
    viewMemories: "यादें देखें",
    reminders: "रिमाइंडर",
    allDone: "सब हो गया!",
    family: "परिवार",
    contactFamily: "परिवार से संपर्क करें",
    logout: "लॉग आउट",
    sos: "एसओएस",
    navHome: "होम",
    navGames: "गेम्स",
    navLifeStory: "जीवन कहानी",
    navReminders: "रिमाइंडर"
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Dictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('English')

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: dictionaries[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
