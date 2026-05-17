import en from './translations/en.json';
import es from './translations/es.json';
import ca from './translations/ca.json';

const translations: Record<string, Record<string, string>> = { en, es, ca };

export function t(hass: { language: string }, key: string): string {
  const lang = hass.language?.split('-')[0] ?? 'en';
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}
