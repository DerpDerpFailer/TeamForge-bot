const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../services/configService');
const { t }         = require('./i18n');

/**
 * Calcule la disposition optimale des boutons par ligne.
 */
function computeLayout(total) {
  if (total <= 5) return { perRow: total };
  let divisor = 2;
  while (divisor <= total) {
    const perRow = Math.ceil(total / divisor);
    if (perRow <= 5) return { perRow };
    divisor++;
  }
  return { perRow: 5 };
}

/**
 * Construit les lignes de boutons de sélection de team
 * + une dernière ligne avec le bouton "Quitter" en rouge.
 * @returns {ActionRowBuilder[]}
 */
function buildTeamButtons() {
  const config = getConfig();
  const teams  = config.teams;
  const total  = teams.length;
  const rows   = [];

  if (total > 0) {
    const { perRow } = computeLayout(total);
    let current = new ActionRowBuilder();

    for (let i = 0; i < total; i++) {
      const team = teams[i];

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

    if (current.components.length > 0) rows.push(current);
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('team_leave')
        .setLabel(t('embed.leaveButton'))
        .setStyle(ButtonStyle.Danger),
    )
  );

  return rows;
}

/**
 * Fetch les membres uniquement si le cache est insuffisant.
 */
async function ensureMemberCache(guild) {
  if (guild.members.cache.size > 1) return;
  await guild.members.fetch();
}

/**
 * Construit l'embed principal des équipes.
 *
 * @param {Guild}   guild
 * @param {boolean} fetchMembers
 * @param {string}  [title]
 * @param {string}  [description]
 */
async function buildTeamsEmbed(guild, fetchMembers = false, title = null, description = null) {
  const config = getConfig();

  if (fetchMembers) {
    await ensureMemberCache(guild);
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title ?? t('embed.title'))
    .setDescription(description ?? t('embed.description'))
    .setTimestamp()
    .setFooter({ text: t('embed.footer') });

  for (const team of config.teams) {
    if (!team.roleId) {
      embed.addFields({
        name:   `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value:  t('embed.roleNotSet'),
        inline: false,
      });
      continue;
    }

    const role = guild.roles.cache.get(team.roleId);

    if (!role) {
      embed.addFields({
        name:   `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value:  t('embed.roleNotFound'),
        inline: false,
      });
      continue;
    }

    const members  = role.members;
    const count    = members.size;
    let memberList = members.map(m => `• ${m}`).join('\n');
    if (!memberList) memberList = t('embed.noMembers');

    embed.addFields({
      name:   `${team.emoji} ${team.name} (${count}/${team.maxPlayers})`,
      value:  memberList,
      inline: false,
    });
  }

  return embed;
}

module.exports = { buildTeamButtons, buildTeamsEmbed };
