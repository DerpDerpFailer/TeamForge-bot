const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig, getMemberSubRoleEmoji } = require('../services/configService');
const { t } = require('./i18n');

/**
 * Calcule la disposition optimale des boutons par ligne.
 * Maximum 3 boutons par ligne.
 *
 * Exemples :
 *   X=1  → [1]
 *   X=3  → [3]
 *   X=4  → [2, 2]
 *   X=6  → [3, 3]
 *   X=7  → [3, 2, 2] ou [3, 3, 1] → on part sur ceil(X/divisor) ≤ 3
 *   X=8  → [3, 3, 2]
 *   X=12 → [3, 3, 3, 3]
 *
 * @param {number} total
 * @returns {{ perRow: number }}
 */
function computeLayout(total) {
  if (total <= 3) return { perRow: total };

  let divisor = 2;
  while (divisor <= total) {
    const perRow = Math.ceil(total / divisor);
    if (perRow <= 3) return { perRow };
    divisor++;
  }

  return { perRow: 3 };
}

/**
 * Construit les lignes de boutons de sélection de team
 * + une dernière ligne avec le bouton "Quitter" en rouge.
 * Maximum 3 boutons par ligne d'équipe.
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

  // ── Bouton "Quitter" sur sa propre ligne ─────────────────────────────────
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

async function buildTeamsEmbed(guild, fetchMembers = false, title = null, description = null) {
  const config   = getConfig();
  const subRoles = config.subRoles ?? [];

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

    let memberList = members.map(m => {
      const subRoleEmoji = getMemberSubRoleEmoji(m.id, subRoles);
      return subRoleEmoji ? `${subRoleEmoji} ${m}` : `• ${m}`;
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
