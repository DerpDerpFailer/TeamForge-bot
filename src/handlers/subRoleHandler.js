const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getConfig, setMemberSubRole, getMemberRoles } = require('../services/configService');
const { t }                                           = require('../utils/i18n');
const logger                                          = require('../utils/logger');

/**
 * Construit le payload de sélection du sous-rôle.
 * Ne contient PAS de flags éphémère ici — géré dans teamHandler via deferReply.
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

  return { embeds: [embed], components: [row] };
}

/**
 * Gère le clic sur un bouton subrole_X.
 * Met à jour le message éphémère avec la confirmation,
 * puis le supprime automatiquement après 3 secondes.
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

  const member      = interaction.member;
  const guild       = interaction.guild;
  const memberRoles = getMemberRoles();
  const currentId   = memberRoles[member.id];
  const isChanging  = currentId !== undefined && currentId !== subRoleId;
  const alreadyHas  = currentId === subRoleId;

  if (alreadyHas) {
    // Message simple éphémère — pas besoin de supprimer
    return interaction.reply({
      content: t('subRole.alreadyChosen', { emoji: subRole.emoji, name: subRole.name }),
      flags:   MessageFlags.Ephemeral,
    });
  }

  // ── Retirer l'ancien rôle Discord si besoin ───────────────────────────────
  if (isChanging && currentId) {
    const oldSubRole = (config.subRoles ?? []).find(r => r.id === currentId);
    if (oldSubRole?.roleId) {
      await member.roles.remove(oldSubRole.roleId).catch(err => {
        logger.error(`Unable to remove old sub-role from ${member.user.tag}: ${err.message}`);
      });
    }
  }

  // ── Ajouter le nouveau rôle Discord si configuré ──────────────────────────
  if (subRole.roleId) {
    const discordRole = guild.roles.cache.get(subRole.roleId)
                     ?? await guild.roles.fetch(subRole.roleId).catch(() => null);
    if (discordRole) {
      await member.roles.add(subRole.roleId).catch(err => {
        logger.error(`Unable to add sub-role to ${member.user.tag}: ${err.message}`);
      });
    }
  }

  // ── Sauvegarder le choix ──────────────────────────────────────────────────
  setMemberSubRole(member.id, subRoleId);

  // ── Log ───────────────────────────────────────────────────────────────────
  const teamRoleIds = (config.teams ?? []).map(tm => tm.roleId).filter(Boolean);
  const teamRole    = member.roles.cache.find(r => teamRoleIds.includes(r.id));
  const team        = teamRole ? config.teams.find(tm => tm.roleId === teamRole.id) : null;
  const teamLabel   = team ? `${team.emoji} ${team.name}` : '?';

  const logKey = isChanging ? 'subRole.logChanged' : 'subRole.logChosen';
  logger.success(t(logKey, { user: member.user.tag, emoji: subRole.emoji, name: subRole.name, team: teamLabel }));

  // ── Rafraîchir le panneau ─────────────────────────────────────────────────
  const { refreshSetupMessage } = require('./teamHandler');
  await refreshSetupMessage(guild, config);

  // ── Mettre à jour le message éphémère avec la confirmation ───────────────
  const confirmMsg = isChanging
    ? t('subRole.changed', { emoji: subRole.emoji, name: subRole.name })
    : t('subRole.success', { emoji: subRole.emoji, name: subRole.name });

  // Utiliser update() si l'interaction vient d'un message déféré (bouton)
  // sinon reply() classique
  try {
    await interaction.update({ content: confirmMsg, embeds: [], components: [] });
  } catch {
    // Fallback si update() échoue (interaction expirée, etc.)
    await interaction.reply({ content: confirmMsg, flags: MessageFlags.Ephemeral });
    return;
  }

  // ── Auto-suppression après 3 secondes ─────────────────────────────────────
  setTimeout(async () => {
    try {
      await interaction.deleteReply();
    } catch {
      // Ignoré — l'interaction peut avoir expiré (15 min max)
    }
  }, 3000);
}

module.exports = { handle, buildSubRolePayload };
