const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getConfig }  = require('../services/configService');
const { t }          = require('../utils/i18n');
const logger         = require('../utils/logger');

/**
 * Construit le message éphémère de sélection du sous-rôle
 * affiché après qu'un membre a rejoint une équipe.
 *
 * @param {Object} team - L'équipe que le membre vient de rejoindre
 * @returns {{ content, embeds, components, flags }}
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

  // Boutons pour chaque sous-rôle (max 5, sur une seule ligne)
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

  const guild  = interaction.guild;
  const member = interaction.member;

  // ── Récupérer le rôle Discord ─────────────────────────────────────────────
  const discordRole = guild.roles.cache.get(subRole.roleId)
                   ?? await guild.roles.fetch(subRole.roleId).catch(() => null);

  if (!discordRole) {
    return interaction.reply({
      content: t('subRole.discordRoleError'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Vérifier si le membre a déjà ce sous-rôle ─────────────────────────────
  if (member.roles.cache.has(subRole.roleId)) {
    return interaction.reply({
      content: t('subRole.alreadyChosen', { emoji: subRole.emoji, name: subRole.name }),
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Retirer tous les anciens sous-rôles ──────────────────────────────────
  const subRoleIds    = (config.subRoles ?? []).map(r => r.roleId).filter(Boolean);
  const toRemove      = member.roles.cache.filter(r => subRoleIds.includes(r.id));
  const isChanging    = toRemove.size > 0;

  if (isChanging) {
    await member.roles.remove(toRemove).catch(err => {
      logger.error(`Unable to remove sub-roles from ${member.user.tag}: ${err.message}`);
    });
  }

  // ── Ajouter le nouveau sous-rôle ──────────────────────────────────────────
  try {
    await member.roles.add(subRole.roleId);
  } catch (err) {
    logger.error(`Unable to add sub-role ${subRole.name} to ${member.user.tag}: ${err.message}`);
    return interaction.reply({
      content: t('subRole.discordRoleError'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Trouver la team du membre pour le log ─────────────────────────────────
  const teamRoleIds = (config.teams ?? []).map(tm => tm.roleId).filter(Boolean);
  const teamRole    = member.roles.cache.find(r => teamRoleIds.includes(r.id));
  const team        = teamRole
    ? config.teams.find(tm => tm.roleId === teamRole.id)
    : null;
  const teamLabel   = team ? `${team.emoji} ${team.name}` : '?';

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
