const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getConfig, setMemberSubRole }       = require('../services/configService');
const { t }                                  = require('../utils/i18n');
const logger                                 = require('../utils/logger');

/**
 * Construit le message éphémère de sélection du sous-rôle.
 */
function buildSubRolePayload(team) {
  const config   = getConfig();
  const subRoles = config.subRoles ?? [];

  if (subRoles.length === 0) {
    return {
      content: t('subRole.noSubRoles'),
      flags:   MessageFlags.Ephemeral,
    };
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('subRole.selectTitle'))
    .setDescription(t('subRole.selectDescription', { emoji: team.emoji, name: team.name }));

  const row = new ActionRowBuilder();
  for (const subRole of subRoles) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`subrole_${subRole.id}`)
        .setLabel(`${subRole.emoji} ${subRole.name}`)
        .setStyle(ButtonStyle.Secondary),
    );
  }

  return {
    embeds:     [embed],
    components: [row],
    flags:      MessageFlags.Ephemeral,
  };
}

/**
 * Gère le clic sur un bouton subrole_X
 */
async function handle(interaction) {
  const subRoleId = parseInt(interaction.customId.split('_')[1]);
  const config    = getConfig();
  const subRole   = (config.subRoles ?? []).find(r => r.id === subRoleId);

  if (!subRole) {
    return interaction.reply({
      content: t('subRole.roleNotFound'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const member    = interaction.member;
  const guild     = interaction.guild;

  // ── Vérifier si le membre a déjà ce sous-rôle ─────────────────────────────
  const { getMemberRoles } = require('../services/configService');
  const memberRoles        = getMemberRoles();
  const currentSubRoleId   = memberRoles[member.id];
  const isChanging         = currentSubRoleId !== undefined && currentSubRoleId !== subRoleId;
  const alreadyChosen      = currentSubRoleId === subRoleId;

  if (alreadyChosen) {
    return interaction.reply({
      content: t('subRole.alreadyChosen', { emoji: subRole.emoji, name: subRole.name }),
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Retirer l'ancien rôle Discord si sub-roles ont des rôles Discord ──────
  if (isChanging && currentSubRoleId) {
    const oldSubRole = (config.subRoles ?? []).find(r => r.id === currentSubRoleId);
    if (oldSubRole?.roleId) {
      await member.roles.remove(oldSubRole.roleId).catch(err => {
        logger.error(`Unable to remove old sub-role from ${member.user.tag}: ${err.message}`);
      });
    }
  }

  // ── Ajouter le nouveau rôle Discord (si configuré) ────────────────────────
  if (subRole.roleId) {
    const discordRole = guild.roles.cache.get(subRole.roleId)
                     ?? await guild.roles.fetch(subRole.roleId).catch(() => null);

    if (discordRole) {
      await member.roles.add(subRole.roleId).catch(err => {
        logger.error(`Unable to add sub-role Discord role to ${member.user.tag}: ${err.message}`);
      });
    }
  }

  // ── Sauvegarder le choix dans memberRoles.json ────────────────────────────
  setMemberSubRole(member.id, subRoleId);

  // ── Trouver la team du membre pour le log ─────────────────────────────────
  const teamRoleIds = (config.teams ?? []).map(tm => tm.roleId).filter(Boolean);
  const teamRole    = member.roles.cache.find(r => teamRoleIds.includes(r.id));
  const team        = teamRole ? config.teams.find(tm => tm.roleId === teamRole.id) : null;
  const teamLabel   = team ? `${team.emoji} ${team.name}` : '?';

  // ── Rafraîchir le panneau ─────────────────────────────────────────────────
  const { refreshSetupMessage } = require('./teamHandler');
  await refreshSetupMessage(guild, config);

  if (isChanging) {
    logger.success(t('subRole.logChanged', { user: member.user.tag, emoji: subRole.emoji, name: subRole.name, team: teamLabel }));
    return interaction.reply({
      content: t('subRole.changed', { emoji: subRole.emoji, name: subRole.name }),
      flags:   MessageFlags.Ephemeral,
    });
  }

  logger.success(t('subRole.logChosen', { user: member.user.tag, emoji: subRole.emoji, name: subRole.name, team: teamLabel }));
  return interaction.reply({
    content: t('subRole.success', { emoji: subRole.emoji, name: subRole.name }),
    flags:   MessageFlags.Ephemeral,
  });
}

module.exports = { handle, buildSubRolePayload };
