const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../services/configService');

/**
 * Construit les lignes de boutons de sélection de team
 * Discord limite à 5 boutons par ActionRow et 5 ActionRows par message
 * → supporte jusqu'à 25 équipes
 * @returns {ActionRowBuilder[]}
 */
function buildTeamButtons() {
  const config  = getConfig();
  const rows    = [];
  let   current = new ActionRowBuilder();

  for (let i = 0; i < config.teams.length; i++) {
    const team = config.teams[i];

    // Nouvelle ligne tous les 5 boutons
    if (i > 0 && i % 5 === 0) {
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

  // Ajouter la dernière ligne si elle contient des boutons
  if (current.components.length > 0) {
    rows.push(current);
  }

  return rows;
}

/**
 * Construit l'embed principal qui affiche les teams et leurs membres
 * Fetch les membres une seule fois pour éviter le rate limit
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
