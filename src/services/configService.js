const fs   = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// La config est stockée dans data/ (volume Docker persistant)
const DATA_DIR    = path.join(__dirname, '../../data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

/**
 * S'assure que le dossier data/ existe
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Config par défaut si aucun fichier n'existe encore
 */
function defaultConfig() {
  return { teams: [], setupMessageId: '', setupChannelId: '' };
}

/**
 * Lit et retourne la configuration depuis data/config.json
 * Retourne une config par défaut si le fichier n'existe pas encore
 */
function getConfig() {
  try {
    ensureDataDir();
    if (!fs.existsSync(CONFIG_PATH)) return defaultConfig();
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`Impossible de lire config.json : ${err.message}`);
    return defaultConfig();
  }
}

/**
 * Sauvegarde la configuration dans data/config.json
 */
function saveConfig(config) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    logger.info('Configuration sauvegardée dans data/config.json');
  } catch (err) {
    logger.error(`Impossible de sauvegarder config.json : ${err.message}`);
  }
}

/**
 * Met à jour les IDs du message de setup
 */
function saveSetupMessage(messageId, channelId) {
  const config = getConfig();
  config.setupMessageId = messageId;
  config.setupChannelId = channelId;
  saveConfig(config);
  logger.info(`Message de setup enregistré : ${messageId} (channel: ${channelId})`);
}

module.exports = { getConfig, saveConfig, saveSetupMessage };