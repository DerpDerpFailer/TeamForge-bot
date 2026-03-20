const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../services/configService');

/**
 * Calcule la disposition optimale des boutons par ligne.
 *
 * Règle :
 *   - Trouver le plus petit diviseur (à partir de 2) tel que ceil(X / diviseur) ≤ 5
 *   - Les premières lignes ont ceil(X / diviseur) boutons
 *   - La dernière ligne prend le reste
 *
 * Exemples :
 *   X=8  → diviseur=2 → ceil(8/2)=4  → [4, 4]
 *   X=11 → diviseur=2 → ceil(11/2)=6 > 5, diviseur=3 → ceil(11/3)=4 → [4, 4, 3]
 *   X=1  → [1]
 *
 * @param {number} total - Nombre total de boutons
 * @returns {{ perRow: number, rows: number }}
 */
function computeLayout(total) {
  if (total <= 5) return { perRow: total, rows: 1 };

  let divisor = 2;
  while (divisor <= total) {
    const perRow = Math.ceil(total / divisor);
    if (perRow <= 5) return { perRow, rows: Math.ceil(total / perRow) };
    divisor++;
  }

  // Fallback (ne devrait pas arriver avec max 25 teams)
  return { perRow: 5, rows: Math.ceil(total / 5) };
}

/**
 * Construit les lignes de boutons de sélection de team.
 * La disposition est calculée automatiquement selon le nombre d'équipes.
 * @returns {ActionRowBuilder[]}
 */
function buildTeamButtons() {
  const config = getConfig();
  const teams  = config.teams;
  const total  = teams.length;

  if (total === 0) return [];

  const { perRow } = computeLayout(total);
  const rows       = [];
  let   current    = new ActionRowBuilder();

  for (let i = 0; i < total; i++) {
    const team = teams[i];

    // Nouvelle ligne tous les `perRow` boutons (sauf pour i=0)
    if (i > 0 && i % perRow === 0) {
      rows.push(current);
      current = new ActionRowBuilder();
    }

    current.addComponents(
      new ButtonBuilder()
        .setCustomId(`team_${team.id}`)
        .setLabel(`${team.emoji} ${team.name}`)
        .setStyle(ButtonStyle.Primary),
    );
  }

  // Ajouter la dernière ligne
  if (current.components.length > 0) rows.push(current);

  return rows;
}

/**
 * Construit l'embed principal qui affiche les teams et leurs membres.
 * Fetch les membres une seule fois pour éviter le rate limit.
 * @param {Guild} guild - Le serveur Discord
 * @returns {Promise<EmbedBuilder>}
 */
async function buildTeamsEmbed(guild) {
  const config = getConfig();

  // ── Fetch unique des membres — évite le rate limit ──────────────────────
  await guild.members.fetch();

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('⚔️ TeamForge — Sélection des équipes')
    .setDescription(
      'Clique sur un bouton pour rejoindre une équipe.\n' +
      'Tu ne peux appartenir qu\'à **une seule équipe** à la fois.'
    )
    .setTimestamp()
    .setFooter({ text: 'TeamForge • Mis à jour' });

  for (const team of config.teams) {
    // Si aucun rôle configuré → avertissement
    if (!team.roleId) {
      embed.addFields({
        name:   `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value:  '⚙️ Rôle non configuré',
        inline: false,
      });
      continue;
    }

    // Récupérer le rôle depuis le cache (membres déjà fetchés)
    const role = guild.roles.cache.get(team.roleId);

    if (!role) {
      embed.addFields({
        name:   `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value:  '❌ Rôle introuvable',
        inline: false,
      });
      continue;
    }

    const members = role.members;
    const count   = members.size;

    let memberList = members.map(m => `• ${m}`).join('\n');
    if (!memberList) memberList = '*Aucun membre*';

    embed.addFields({
      name:   `${team.emoji} ${team.name} (${count}/${team.maxPlayers})`,
      value:  memberList,
      inline: false,
    });
  }

  return embed;
}

module.exports = { buildTeamButtons, buildTeamsEmbed };
