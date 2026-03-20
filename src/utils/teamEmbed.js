const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../services/configService');

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
 * + une dernière ligne avec le bouton "Quitter mon équipe" en rouge.
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

  // ── Bouton "Quitter mon équipe" sur une ligne séparée ───────────────────
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('team_leave')
        .setLabel('🚪 Quitter mon équipe')
        .setStyle(ButtonStyle.Danger),
    )
  );

  return rows;
}

/**
 * Fetch les membres du serveur uniquement si le cache est insuffisant.
 * Évite les rate limits sur les appels répétés.
 * @param {Guild} guild
 */
async function ensureMemberCache(guild) {
  // Si le cache contient déjà des membres, on ne re-fetch pas
  if (guild.members.cache.size > 1) return;
  await guild.members.fetch();
}

/**
 * Construit l'embed principal qui affiche les teams et leurs membres.
 *
 * @param {Guild}   guild          - Le serveur Discord
 * @param {boolean} fetchMembers   - Si true, force un fetch si le cache est vide
 * @param {string}  [title]        - Titre personnalisé (optionnel)
 * @param {string}  [description]  - Description personnalisée (optionnelle)
 * @returns {Promise<EmbedBuilder>}
 */
async function buildTeamsEmbed(guild, fetchMembers = false, title = null, description = null) {
  const config = getConfig();

  if (fetchMembers) {
    await ensureMemberCache(guild);
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title ?? '⚔️ TeamForge — Sélection des équipes')
    .setDescription(
      description ??
      'Clique sur un bouton pour rejoindre une équipe.\n' +
      'Tu ne peux appartenir qu\'à **une seule équipe** à la fois.\n' +
      'Clique sur 🚪 **Quitter mon équipe** pour te retirer.'
    )
    .setTimestamp()
    .setFooter({ text: 'TeamForge • Mis à jour' });

  for (const team of config.teams) {
    if (!team.roleId) {
      embed.addFields({
        name:   `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value:  '⚙️ Rôle non configuré',
        inline: false,
      });
      continue;
    }

    const role = guild.roles.cache.get(team.roleId);

    if (!role) {
      embed.addFields({
        name:   `${team.emoji} ${team.name} (0/${team.maxPlayers})`,
        value:  '❌ Rôle introuvable',
        inline: false,
      });
      continue;
    }

    const members  = role.members;
    const count    = members.size;
    let memberList = members.map(m => `• ${m}`).join('\n');
    if (!memberList) memberList = '*Aucun membre*';

    embed.addFields({
      name:   `${team.emoji} ${team.name} (${count}/${team.maxPlayers})`,
      value:  memberList,
      inline: false,
    });
  }

  return embed;
}

module.exports = { buildTeamButtons, buildTeamsEmbed };
