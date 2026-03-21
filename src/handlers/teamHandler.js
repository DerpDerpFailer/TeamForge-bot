const { MessageFlags }                      = require('discord.js');
const { getConfig, clearMemberSubRole }     = require('../services/configService');
const { buildTeamButtons, buildTeamsEmbed } = require('../utils/teamEmbed');
const { buildSubRolePayload }               = require('./subRoleHandler');
const { t }                                 = require('../utils/i18n');
const logger                                = require('../utils/logger');

async function handle(interaction) {
  if (interaction.customId === 'team_leave') return handleLeave(interaction);
  return handleJoin(interaction);
}

async function handleJoin(interaction) {
  const teamId = parseInt(interaction.customId.split('_')[1]);
  const config = getConfig();
  const team   = config.teams.find(t => t.id === teamId);

  if (!team) {
    return interaction.reply({
      content: t('general.unknownTeam'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const guild  = interaction.guild;
  const member = interaction.member;

  // ── Membre déjà dans cette team → réafficher la sélection de sous-rôle ───
  if (member.roles.cache.has(team.roleId)) {
    const subRolePayload = buildSubRolePayload(team);

    // Pas de sous-rôles configurés → réponse simple
    if (!subRolePayload.embeds) {
      return interaction.reply(subRolePayload);
    }

    // Déférer pour permettre deleteReply() plus tard
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    return interaction.editReply(subRolePayload);
  }

  // ── Récupérer le rôle depuis le cache ────────────────────────────────────
  const role = guild.roles.cache.get(team.roleId)
            ?? await guild.roles.fetch(team.roleId).catch(() => null);

  if (!role) {
    return interaction.reply({
      content: t('teamHandler.roleNotFound'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Vérifier si la team est pleine ──────────────────────────────────────
  const currentCount = role.members.size;

  if (currentCount >= team.maxPlayers) {
    return interaction.reply({
      content: t('teamHandler.teamFull', { emoji: team.emoji, name: team.name, current: currentCount, max: team.maxPlayers }),
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Retirer tous les anciens rôles Team ET sous-rôles Discord ────────────
  const teamRoleIds   = config.teams.map(t => t.roleId).filter(Boolean);
  const subRoleIds    = (config.subRoles ?? []).map(r => r.roleId).filter(Boolean);
  const allRoleIds    = [...teamRoleIds, ...subRoleIds];
  const rolesToRemove = member.roles.cache.filter(r => allRoleIds.includes(r.id));

  if (rolesToRemove.size > 0) {
    await member.roles.remove(rolesToRemove).catch(err => {
      logger.error(`Unable to remove roles from ${member.user.tag}: ${err.message}`);
    });
  }

  // ── Effacer le sous-rôle persisté (il devra rechoisir) ───────────────────
  clearMemberSubRole(member.id);

  // ── Ajouter le nouveau rôle Team ──────────────────────────────────────────
  try {
    await member.roles.add(team.roleId);
  } catch (err) {
    logger.error(`Unable to add role ${team.name} to ${member.user.tag}: ${err.message}`);
    return interaction.reply({
      content: t('teamHandler.roleAddError'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  logger.success(t('teamHandler.logJoined', { user: member.user.tag, emoji: team.emoji, name: team.name }));

  // ── Mettre à jour le panneau ──────────────────────────────────────────────
  await refreshSetupMessage(guild, config);

  // ── Afficher la sélection de sous-rôle (deferée pour permettre deleteReply) ─
  const subRolePayload = buildSubRolePayload(team);

  if (!subRolePayload.embeds) {
    // Pas de sous-rôles → réponse simple non supprimable
    return interaction.reply(subRolePayload);
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  return interaction.editReply(subRolePayload);
}

async function handleLeave(interaction) {
  const config        = getConfig();
  const member        = interaction.member;
  const guild         = interaction.guild;

  const teamRoleIds   = config.teams.map(t => t.roleId).filter(Boolean);
  const subRoleIds    = (config.subRoles ?? []).map(r => r.roleId).filter(Boolean);
  const allRoleIds    = [...teamRoleIds, ...subRoleIds];

  if (!member.roles.cache.some(r => teamRoleIds.includes(r.id))) {
    return interaction.reply({
      content: t('teamHandler.leaveNoTeam'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const removedTeamRole = member.roles.cache.find(r => teamRoleIds.includes(r.id));
  const team            = config.teams.find(t => t.roleId === removedTeamRole?.id);
  const teamLabel       = team ? `**${team.emoji} ${team.name}**` : `**${removedTeamRole?.name}**`;
  const rolesToRemove   = member.roles.cache.filter(r => allRoleIds.includes(r.id));

  try {
    await member.roles.remove(rolesToRemove);
  } catch (err) {
    logger.error(`Unable to remove roles from ${member.user.tag}: ${err.message}`);
    return interaction.reply({
      content: t('teamHandler.leaveRoleError'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  clearMemberSubRole(member.id);

  logger.success(t('teamHandler.logLeft', { user: member.user.tag, team: teamLabel }));

  await refreshSetupMessage(guild, config);

  return interaction.reply({
    content: t('teamHandler.leaveSuccess', { team: teamLabel }),
    flags:   MessageFlags.Ephemeral,
  });
}

async function refreshSetupMessage(guild, config) {
  if (!config.setupMessageId || !config.setupChannelId) return;

  try {
    const channel = await guild.channels.fetch(config.setupChannelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(config.setupMessageId).catch(() => null);
    if (!message) return;

    const embed   = await buildTeamsEmbed(guild, false);
    const buttons = buildTeamButtons();

    await message.edit({ embeds: [embed], components: buttons });
    logger.info(t('teamHandler.logRefreshed'));
  } catch (err) {
    logger.error(t('teamHandler.logRefreshError', { error: err.message }));
  }
}

module.exports = { handle, refreshSetupMessage };
