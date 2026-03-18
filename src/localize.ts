import en from './translations/en.json';
import ca from './translations/ca.json';
import es from './translations/es.json';

const translations: Record<string, Record<string, unknown>> = { en, ca, es };

export function localize(key: string, language: string): string {
  const lang = translations[language] ?? translations['en'];
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = parts.reduce((obj: any, part) => obj?.[part], lang);
  if (typeof value === 'string') return value;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallback = parts.reduce((obj: any, part) => obj?.[part], translations['en']);
  return typeof fallback === 'string' ? fallback : key;
}
