const { MessageFlags }                      = require('discord.js');
const { getConfig }                         = require('../services/configService');
const { buildTeamButtons, buildTeamsEmbed } = require('../utils/teamEmbed');
const logger                                = require('../utils/logger');

/**
 * Point d'entrée — appelé quand un membre clique sur un bouton team_X ou team_leave
 */
async function handle(interaction) {
  const customId = interaction.customId;

  // ── Bouton "Quitter mon équipe" ──────────────────────────────────────────
  if (customId === 'team_leave') {
    return handleLeave(interaction);
  }

  // ── Bouton de sélection d'équipe ─────────────────────────────────────────
  return handleJoin(interaction);
}

// ════════════════════════════════════════════════════════════════════════════

/**
 * Gère le clic sur un bouton d'équipe (rejoindre)
 */
async function handleJoin(interaction) {
  const teamId = parseInt(interaction.customId.split('_')[1]); // "team_3" → 3
  const config = getConfig();
  const team   = config.teams.find(t => t.id === teamId);

  if (!team) {
    return interaction.reply({
      content: '❌ Équipe introuvable.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  const guild  = interaction.guild;
  const member = interaction.member;

  // ── Vérifier si le membre est déjà dans cette team ──────────────────────
  if (member.roles.cache.has(team.roleId)) {
    return interaction.reply({
      content: `✅ Tu es déjà dans **${team.emoji} ${team.name}** !`,
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Récupérer le rôle depuis le cache ────────────────────────────────────
  const role = guild.roles.cache.get(team.roleId)
            ?? await guild.roles.fetch(team.roleId).catch(() => null);

  if (!role) {
    return interaction.reply({
      content: '❌ Le rôle de cette équipe est introuvable. Contacte un administrateur.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Vérifier si la team est pleine ──────────────────────────────────────
  const currentCount = role.members.size;

  if (currentCount >= team.maxPlayers) {
    return interaction.reply({
      content: `❌ **${team.emoji} ${team.name}** est complète ! (${currentCount}/${team.maxPlayers})`,
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Retirer tous les anciens rôles Team ─────────────────────────────────
  const teamRoleIds   = config.teams.map(t => t.roleId).filter(Boolean);
  const rolesToRemove = member.roles.cache.filter(r => teamRoleIds.includes(r.id));

  if (rolesToRemove.size > 0) {
    await member.roles.remove(rolesToRemove).catch(err => {
      logger.error(`Impossible de retirer les rôles de ${member.user.tag} : ${err.message}`);
    });
  }

  // ── Ajouter le nouveau rôle ──────────────────────────────────────────────
  try {
    await member.roles.add(team.roleId);
  } catch (err) {
    logger.error(`Impossible d'ajouter le rôle ${team.name} à ${member.user.tag} : ${err.message}`);
    return interaction.reply({
      content: '❌ Impossible d\'ajouter le rôle. Vérifie la hiérarchie des rôles.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  logger.success(`${member.user.tag} a rejoint ${team.emoji} ${team.name}`);

  await refreshSetupMessage(interaction.guild, config);

  return interaction.reply({
    content: `✅ Tu as rejoint **${team.emoji} ${team.name}** !`,
    flags:   MessageFlags.Ephemeral,
  });
}

/**
 * Gère le clic sur le bouton "Quitter mon équipe"
 */
async function handleLeave(interaction) {
  const config  = getConfig();
  const member  = interaction.member;
  const guild   = interaction.guild;

  // ── Chercher si le membre a un rôle Team ────────────────────────────────
  const teamRoleIds   = config.teams.map(t => t.roleId).filter(Boolean);
  const rolesToRemove = member.roles.cache.filter(r => teamRoleIds.includes(r.id));

  if (rolesToRemove.size === 0) {
    return interaction.reply({
      content: '❌ Tu ne fais partie d\'aucune équipe.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Trouver le nom de l'équipe pour le message de confirmation ───────────
  const removedRole = rolesToRemove.first();
  const team        = config.teams.find(t => t.roleId === removedRole.id);
  const teamLabel   = team ? `**${team.emoji} ${team.name}**` : `**${removedRole.name}**`;

  // ── Retirer le(s) rôle(s) Team ───────────────────────────────────────────
  try {
    await member.roles.remove(rolesToRemove);
  } catch (err) {
    logger.error(`Impossible de retirer le rôle de ${member.user.tag} : ${err.message}`);
    return interaction.reply({
      content: '❌ Impossible de te retirer de l\'équipe. Vérifie la hiérarchie des rôles.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  logger.success(`${member.user.tag} a quitté ${teamLabel}`);

  await refreshSetupMessage(guild, config);

  return interaction.reply({
    content: `✅ Tu as quitté ${teamLabel} !`,
    flags:   MessageFlags.Ephemeral,
  });
}

/**
 * Rafraîchit le message du panneau de sélection des équipes.
 * N'effectue PAS de guild.members.fetch() pour éviter le rate limit.
 */
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
    logger.info('Panneau des équipes mis à jour');
  } catch (err) {
    logger.error(`Impossible de rafraîchir le panneau : ${err.message}`);
  }
}

module.exports = { handle, refreshSetupMessage };
