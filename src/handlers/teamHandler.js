const { MessageFlags }                      = require('discord.js');
const { getConfig }                         = require('../services/configService');
const { buildTeamButtons, buildTeamsEmbed } = require('../utils/teamEmbed');
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

  if (member.roles.cache.has(team.roleId)) {
    return interaction.reply({
      content: t('teamHandler.alreadyInTeam', { emoji: team.emoji, name: team.name }),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const role = guild.roles.cache.get(team.roleId)
            ?? await guild.roles.fetch(team.roleId).catch(() => null);

  if (!role) {
    return interaction.reply({
      content: t('teamHandler.roleNotFound'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const currentCount = role.members.size;

  if (currentCount >= team.maxPlayers) {
    return interaction.reply({
      content: t('teamHandler.teamFull', { emoji: team.emoji, name: team.name, current: currentCount, max: team.maxPlayers }),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const teamRoleIds   = config.teams.map(t => t.roleId).filter(Boolean);
  const rolesToRemove = member.roles.cache.filter(r => teamRoleIds.includes(r.id));

  if (rolesToRemove.size > 0) {
    await member.roles.remove(rolesToRemove).catch(err => {
      logger.error(`Unable to remove roles from ${member.user.tag}: ${err.message}`);
    });
  }

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

  await refreshSetupMessage(guild, config);

  return interaction.reply({
    content: t('teamHandler.joinSuccess', { emoji: team.emoji, name: team.name }),
    flags:   MessageFlags.Ephemeral,
  });
}

async function handleLeave(interaction) {
  const config        = getConfig();
  const member        = interaction.member;
  const guild         = interaction.guild;
  const teamRoleIds   = config.teams.map(t => t.roleId).filter(Boolean);
  const rolesToRemove = member.roles.cache.filter(r => teamRoleIds.includes(r.id));

  if (rolesToRemove.size === 0) {
    return interaction.reply({
      content: t('teamHandler.leaveNoTeam'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const removedRole = rolesToRemove.first();
  const team        = config.teams.find(t => t.roleId === removedRole.id);
  const teamLabel   = team ? `**${team.emoji} ${team.name}**` : `**${removedRole.name}**`;

  try {
    await member.roles.remove(rolesToRemove);
  } catch (err) {
    logger.error(`Unable to remove role from ${member.user.tag}: ${err.message}`);
    return interaction.reply({
      content: t('teamHandler.leaveRoleError'),
      flags:   MessageFlags.Ephemeral,
    });
  }

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
