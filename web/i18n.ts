import { notFound } from 'next/navigation';

export const locales = ['pt', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];

export async function getMessages(locale: string) {
  if (!locales.includes(locale as Locale)) notFound();
  
  try {
    return (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}
