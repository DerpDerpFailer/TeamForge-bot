const fs   = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DATA_DIR          = path.join(__dirname, '../../data');
const CONFIG_PATH       = path.join(DATA_DIR, 'config.json');
const MEMBER_ROLES_PATH = path.join(DATA_DIR, 'memberRoles.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultConfig() {
  return { teams: [], setupMessageId: '', setupChannelId: '' };
}

// ── Config ────────────────────────────────────────────────────────────────

function getConfig() {
  try {
    ensureDataDir();
    if (!fs.existsSync(CONFIG_PATH)) return defaultConfig();
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`Unable to read config.json: ${err.message}`);
    return defaultConfig();
  }
}

function saveConfig(config) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    logger.info('Configuration saved in data/config.json');
  } catch (err) {
    logger.error(`Unable to save config.json: ${err.message}`);
  }
}

function saveSetupMessage(messageId, channelId) {
  const config = getConfig();
  config.setupMessageId = messageId;
  config.setupChannelId = channelId;
  saveConfig(config);
  logger.info(`Setup message saved: ${messageId} (channel: ${channelId})`);
}

// ── Member Roles ──────────────────────────────────────────────────────────
// Stocke le sous-rôle choisi par chaque membre
// Format : { "userId": subRoleId, ... }

function getMemberRoles() {
  try {
    ensureDataDir();
    if (!fs.existsSync(MEMBER_ROLES_PATH)) return {};
    const raw = fs.readFileSync(MEMBER_ROLES_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`Unable to read memberRoles.json: ${err.message}`);
    return {};
  }
}

function saveMemberRoles(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(MEMBER_ROLES_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    logger.error(`Unable to save memberRoles.json: ${err.message}`);
  }
}

/**
 * Enregistre le sous-rôle choisi par un membre
 * @param {string} userId
 * @param {number} subRoleId
 */
function setMemberSubRole(userId, subRoleId) {
  const data   = getMemberRoles();
  data[userId] = subRoleId;
  saveMemberRoles(data);
}

/**
 * Supprime le sous-rôle d'un membre (quitte l'équipe, reset, etc.)
 * @param {string} userId
 */
function clearMemberSubRole(userId) {
  const data = getMemberRoles();
  delete data[userId];
  saveMemberRoles(data);
}

/**
 * Supprime tous les sous-rôles (reset quotidien)
 */
function clearAllMemberSubRoles() {
  saveMemberRoles({});
  logger.info('All member sub-roles cleared');
}

/**
 * Retourne l'emoji du sous-rôle d'un membre, ou '' si non défini
 * @param {string} userId
 * @param {Array}  subRoles - config.subRoles
 * @returns {string}
 */
function getMemberSubRoleEmoji(userId, subRoles = []) {
  const data      = getMemberRoles();
  const subRoleId = data[userId];
  if (!subRoleId) return '';
  const subRole = subRoles.find(r => r.id === subRoleId);
  return subRole ? subRole.emoji : '';
}

module.exports = {
  getConfig,
  saveConfig,
  saveSetupMessage,
  getMemberRoles,
  setMemberSubRole,
  clearMemberSubRole,
  clearAllMemberSubRoles,
  getMemberSubRoleEmoji,
};
