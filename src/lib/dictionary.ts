// src/lib/dictionary.ts

import 'server-only';
import type { Dictionary } from '@/types/dictionary';

// This object maps locales to a function that dynamically imports the corresponding JSON.
const dictionaries = {
  en: () => import('@/app/dictionaries/en.json'),
  si: () => import('@/app/dictionaries/si.json'),
} as const;

type SupportedLocale = keyof typeof dictionaries;

// This is the single source of truth for getting a dictionary.
export const getDictionary = async (locale: string): Promise<Dictionary> => {
  // Choose the correct import function based on the locale, with 'en' as a fallback.
  const supportedLocale = (locale in dictionaries) ? locale as SupportedLocale : 'en';
  const getModule = dictionaries[supportedLocale];
  
  // Await the dynamic import.
  const importedModule = await getModule();
  
  // FIX: Assert the type here. We are confident the imported JSON matches our
  // Dictionary type, and this single assertion makes the function type-safe.
  return importedModule.default as Dictionary;
};