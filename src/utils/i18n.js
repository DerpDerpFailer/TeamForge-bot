const { getConfig } = require('../services/configService');

const locales = {
  en: require('../locales/en'),
  fr: require('../locales/fr'),
};

const DEFAULT_LANG = 'en';

/**
 * Retourne la langue active depuis config.json
 * @returns {string} 'en' | 'fr'
 */
function getLang() {
  const config = getConfig();
  return locales[config.language] ? config.language : DEFAULT_LANG;
}

/**
 * Retourne la traduction d'une clé (format: 'section.key')
 * Supporte les variables via {placeholder}
 *
 * @param {string} key      - Clé de traduction (ex: 'teamHandler.joinSuccess')
 * @param {Object} [vars]   - Variables à injecter (ex: { name: 'Team 1', emoji: '🔴' })
 * @returns {string}
 *
 * @example
 * t('teamHandler.joinSuccess', { emoji: '🔴', name: 'Team 1' })
 * // → '✅ You joined **🔴 Team 1**!'
 */
function t(key, vars = {}) {
  const lang    = getLang();
  const locale  = locales[lang];
  const parts   = key.split('.');

  // Naviguer dans l'objet de traduction
  let value = locale;
  for (const part of parts) {
    value = value?.[part];
  }

  // Fallback sur EN si la clé n'existe pas dans la langue active
  if (value === undefined) {
    value = locales[DEFAULT_LANG];
    for (const part of parts) {
      value = value?.[part];
    }
  }

  // Fallback ultime : retourner la clé brute
  if (typeof value !== 'string') return key;

  // Remplacer les variables {placeholder}
  return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

module.exports = { t, getLang };
