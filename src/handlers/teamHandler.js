const { getConfig }                        = require('../services/configService');
const { buildTeamButtons, buildTeamsEmbed } = require('../utils/teamEmbed');
const logger                                = require('../utils/logger');

/**
 * Point d'entrée — appelé quand un membre clique sur un bouton team_X
 */
async function handle(interaction) {
  const teamId = parseInt(interaction.customId.split('_')[1]); // "team_3" → 3
  const config = getConfig();
  const team   = config.teams.find(t => t.id === teamId);

  if (!team) {
    return interaction.reply({
      content: '❌ Équipe introuvable.',
      ephemeral: true,
    });
  }

  const guild  = interaction.guild;
  const member = interaction.member;

  // ── Vérifier si le membre est déjà dans cette team ──────────────────────
  if (member.roles.cache.has(team.roleId)) {
    return interaction.reply({
      content: `✅ Tu es déjà dans **${team.emoji} ${team.name}** !`,
      ephemeral: true,
    });
  }

  // ── Récupérer le rôle et vérifier s'il existe ───────────────────────────
  const role = await guild.roles.fetch(team.roleId).catch(() => null);

  if (!role) {
    return interaction.reply({
      content: '❌ Le rôle de cette équipe est introuvable. Contacte un administrateur.',
      ephemeral: true,
    });
  }

  // ── Vérifier si la team est pleine ──────────────────────────────────────
  await guild.members.fetch();
  const currentCount = role.members.size;

  if (currentCount >= team.maxPlayers) {
    return interaction.reply({
      content: `❌ **${team.emoji} ${team.name}** est complète ! (${currentCount}/${team.maxPlayers})`,
      ephemeral: true,
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
      ephemeral: true,
    });
  }

  logger.success(`${member.user.tag} a rejoint ${team.emoji} ${team.name}`);

  // ── Mettre à jour le message du panneau ─────────────────────────────────
  await refreshSetupMessage(guild, config);

  return interaction.reply({
    content: `✅ Tu as rejoint **${team.emoji} ${team.name}** !`,
    ephemeral: true,
  });
}

/**
 * Rafraîchit le message du panneau de sélection des équipes
 */
async function refreshSetupMessage(guild, config) {
  if (!config.setupMessageId || !config.setupChannelId) return;

  try {
    const channel = await guild.channels.fetch(config.setupChannelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(config.setupMessageId).catch(() => null);
    if (!message) return;

    const embed   = await buildTeamsEmbed(guild);
    const buttons = buildTeamButtons();

    await message.edit({ embeds: [embed], components: [buttons] });
    logger.info('Panneau des équipes mis à jour');
  } catch (err) {
    logger.error(`Impossible de rafraîchir le panneau : ${err.message}`);
  }
}

module.exports = { handle, refreshSetupMessage };
