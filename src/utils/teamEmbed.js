const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../services/configService');

/**
 * Calcule la disposition optimale des boutons par ligne.
 *
 * Règle :
 *   - Trouver le plus petit diviseur (à partir de 2) tel que ceil(X / diviseur) ≤ 5
 *   - Les premières lignes ont ceil(X / diviseur) boutons
 *   - La dernière ligne prend le reste
 *
 * Exemples :
 *   X=8  → diviseur=2 → ceil(8/2)=4  → [4, 4]
 *   X=11 → diviseur=3 → ceil(11/3)=4 → [4, 4, 3]
 *
 * @param {number} total
 * @returns {{ perRow: number }}
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
  const config  = getConfig();
  const teams   = config.teams;
  const total   = teams.length;

  const rows = [];

  // ── Boutons des équipes ─────────────────────────────────────────────────
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
  const leaveRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('team_leave')
      .setLabel('🚪 Quitter mon équipe')
      .setStyle(ButtonStyle.Danger),
  );
  rows.push(leaveRow);

  return rows;
}

/**
 * Construit l'embed principal qui affiche les teams et leurs membres.
 *
 * @param {Guild} guild          - Le serveur Discord
 * @param {boolean} fetchMembers - Si true, force un fetch des membres (premier affichage)
 *                                 Si false, utilise uniquement le cache (refresh)
 * @returns {Promise<EmbedBuilder>}
 */
async function buildTeamsEmbed(guild, fetchMembers = false) {
  const config = getConfig();

  // ── Fetch membres seulement si explicitement demandé ────────────────────
  if (fetchMembers) {
    await guild.members.fetch();
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('⚔️ TeamForge — Sélection des équipes')
    .setDescription(
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

    const members = role.members;
    const count   = members.size;

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
