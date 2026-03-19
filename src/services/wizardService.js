// Stockage en mémoire des sessions wizard (une par utilisateur)
// La session est détruite à la fin du wizard ou en cas d'annulation
const sessions = new Map();

/**
 * Crée une nouvelle session wizard pour un utilisateur
 * @param {string} userId
 * @param {number} teamCount
 */
function createSession(userId, teamCount) {
  const teams = Array.from({ length: teamCount }, (_, i) => ({
    id:         i + 1,
    name:       `Team ${i + 1}`,
    emoji:      '⚔️',
    maxPlayers: 6,
    roleId:     '',
  }));
  sessions.set(userId, { teamCount, teams });
  return sessions.get(userId);
}

function getSession(userId) {
  return sessions.get(userId) || null;
}

function deleteSession(userId) {
  sessions.delete(userId);
}

/**
 * Met à jour les données d'une équipe dans la session
 */
function updateTeam(userId, index, data) {
  const s = sessions.get(userId);
  if (!s) return false;
  s.teams[index] = { ...s.teams[index], ...data };
  return true;
}

/**
 * Assigne un roleId à une équipe dans la session
 */
function setTeamRole(userId, index, roleId) {
  const s = sessions.get(userId);
  if (!s) return false;
  s.teams[index].roleId = roleId;
  return true;
}

module.exports = { createSession, getSession, deleteSession, updateTeam, setTeamRole };