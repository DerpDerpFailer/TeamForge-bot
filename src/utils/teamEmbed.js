const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig, getMemberSubRoleEmoji } = require('../services/configService');
const { t } = require('./i18n');

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

async function ensureMemberCache(guild) {
  if (guild.members.cache.size > 1) return;
  await guild.members.fetch();
}

/**
 * Construit l'embed principal des équipes.
 * Affiche l'emoji du sous-rôle choisi devant chaque pseudo.
 */
async function buildTeamsEmbed(guild, fetchMembers = false, title = null, description = null) {
  const config    = getConfig();
  const subRoles  = config.subRoles ?? [];

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

    const members = role.members;
    const count   = members.size;

    // Construire la liste avec l'emoji du sous-rôle devant chaque membre
    let memberList = members.map(m => {
      const subRoleEmoji = getMemberSubRoleEmoji(m.id, subRoles);
      return subRoleEmoji
        ? `${subRoleEmoji} ${m}`   // ex: 🛡️ @DerpyFailer
        : `• ${m}`;                // ex: • @DerpyFailer (pas de sous-rôle)
    }).join('\n');

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
