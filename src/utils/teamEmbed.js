const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../../data/configService');

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
        .setCustomId(`team_${team.id}`)        // ex: "team_1"
        .setLabel(`${team.emoji} ${team.name}`)
        .setStyle(ButtonStyle.Primary),
    );
  }

  return row;
}

/**
 * Construit l'embed principal qui affiche les teams et leurs membres
 * @param {Guild} guild - Le serveur Discord
 * @returns {Promise<EmbedBuilder>}
 */
async function buildTeamsEmbed(guild) {
  const config = getConfig();
  const embed  = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('⚔️ TeamForge — Sélection des équipes')
    .setDescription('Clique sur un bouton pour rejoindre une équipe.\nTu ne peux appartenir qu\'à **une seule équipe** à la fois.')
    .setTimestamp()
    .setFooter({ text: 'TeamForge • Mis à jour' });

  for (const team of config.teams) {
    // Si aucun rôle configuré → afficher un avertissement
    if (!team.roleId) {
      embed.addFields({
        name: `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value: '⚙️ Rôle non configuré',
        inline: false,
      });
      continue;
    }

    // Récupérer les membres ayant ce rôle
    const role = await guild.roles.fetch(team.roleId).catch(() => null);

    if (!role) {
      embed.addFields({
        name: `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value: '❌ Rôle introuvable',
        inline: false,
      });
      continue;
    }

    // Récupérer les membres frais depuis l'API Discord
    await guild.members.fetch();
    const members = role.members;
    const count   = members.size;

    // Construire la liste des membres
    let memberList = members.map(m => `• ${m}`).join('\n');
    if (!memberList) memberList = '*Aucun membre*';

    embed.addFields({
      name: `${team.emoji} ${team.name} (${count}/${team.maxPlayers})`,
      value: memberList,
      inline: false,
    });
  }

  return embed;
}

module.exports = { buildTeamButtons, buildTeamsEmbed };