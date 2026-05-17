const translations: Record<string, Record<string, string>> = {
  en: {
    lifecycle: 'Lifecycle',
  },
  es: {
    lifecycle: 'Ciclo de vida',
  },
  ca: {
    lifecycle: 'Cicle de vida',
  },
};

export function t(hass: { language: string }, key: string): string {
  const lang = hass.language?.split('-')[0] ?? 'en';
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}
