import en from './translations/en.json';
import es from './translations/es.json';
import ca from './translations/ca.json';

const translations: Record<string, Record<string, unknown>> = { en, es, ca };

function resolve(obj: Record<string, unknown>, key: string): string | undefined {
  const result = key.split('.').reduce<unknown>((node, part) => {
    return node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
  }, obj);
  return typeof result === 'string' ? result : undefined;
}

export function t(hass: { language: string }, key: string): string {
  const lang = hass.language?.split('-')[0] ?? 'en';
  return resolve(translations[lang] ?? {}, key) ?? resolve(translations['en'], key) ?? key;
}
