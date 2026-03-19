const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getConfig } = require('../services/configService');

/**
 * Construit les boutons de sélection de team
 * @returns {ActionRowBuilder}
 */
function buildTeamButtons() {
  const config = getConfig();
  const row    = new ActionRowBuilder();

  for (const team of config.teams) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`team_${team.id}`)
        .setLabel(`${team.emoji} ${team.name}`)
        .setStyle(ButtonStyle.Primary),
    );
  }

  return row;
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

    // Récupérer le rôle (membres déjà fetchés, pas de nouvel appel API)
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
