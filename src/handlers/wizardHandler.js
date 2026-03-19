const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  RoleSelectMenuBuilder,
} = require('discord.js');

const wizardService               = require('../services/wizardService');
const { getConfig, saveConfig }   = require('../../data/configService');
const logger                      = require('../utils/logger');

// ════════════════════════════════════════════════════════════════════════════
// ROUTER — point d'entrée unique pour toutes les interactions wizard
// ════════════════════════════════════════════════════════════════════════════
async function handle(interaction) {

  // ── Boutons ──────────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const id = interaction.customId;

    if (id === 'wizard_overwrite_confirm') return handleOverwriteConfirm(interaction);
    if (id === 'wizard_overwrite_cancel')  return handleCancel(interaction);
    if (id.startsWith('wizard_count_'))    return handleCountSelect(interaction);
    if (id.startsWith('wizard_edit_team_'))return handleEditTeam(interaction);
    if (id === 'wizard_confirm')           return handleConfirm(interaction);
    if (id === 'wizard_cancel')            return handleCancel(interaction);
  }

  // ── Modals ───────────────────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('wizard_team_modal_')) {
      return handleTeamModalSubmit(interaction);
    }
  }

  // ── Role Select Menus ────────────────────────────────────────────────────
  if (interaction.isRoleSelectMenu()) {
    if (interaction.customId.startsWith('wizard_role_')) {
      return handleRoleSelect(interaction);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════════════════════════

// ── Confirmation d'écrasement ─────────────────────────────────────────────
async function handleOverwriteConfirm(interaction) {
  wizardService.deleteSession(interaction.user.id);
  return interaction.update(buildTeamCountPayload());
}

// ── Sélection du nombre d'équipes ─────────────────────────────────────────
async function handleCountSelect(interaction) {
  const count   = parseInt(interaction.customId.split('_')[2]);
  const session = wizardService.createSession(interaction.user.id, count);
  return interaction.update(buildTeamConfigPayload(session, 0));
}

// ── Ouverture du modal de configuration d'une équipe ─────────────────────
async function handleEditTeam(interaction) {
  const index   = parseInt(interaction.customId.split('_')[3]);
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      ephemeral: true,
    });
  }

  const team = session.teams[index];

  const modal = new ModalBuilder()
    .setCustomId(`wizard_team_modal_${index}`)
    .setTitle(`Équipe ${index + 1} / ${session.teamCount}`);

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_name')
        .setLabel('Nom de l\'équipe')
        .setStyle(TextInputStyle.Short)
        .setValue(team.name)
        .setMaxLength(32)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_emoji')
        .setLabel('Emoji  (ex: 🔴  🔵  🟢  ⚡  💀)')
        .setStyle(TextInputStyle.Short)
        .setValue(team.emoji)
        .setMaxLength(8)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_max')
        .setLabel('Nombre maximum de joueurs (1–99)')
        .setStyle(TextInputStyle.Short)
        .setValue(String(team.maxPlayers))
        .setMaxLength(3)
        .setRequired(true)
    ),
  );

  // showModal() est la réponse à l'interaction — pas d'update/reply séparé
  return interaction.showModal(modal);
}

// ── Traitement du modal soumis ────────────────────────────────────────────
async function handleTeamModalSubmit(interaction) {
  const index   = parseInt(interaction.customId.split('_')[3]);
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      ephemeral: true,
    });
  }

  const name   = interaction.fields.getTextInputValue('team_name').trim();
  const emoji  = interaction.fields.getTextInputValue('team_emoji').trim();
  const maxRaw = interaction.fields.getTextInputValue('team_max').trim();
  const max    = parseInt(maxRaw);

  // Validation
  if (isNaN(max) || max < 1 || max > 99) {
    return interaction.reply({
      content: '❌ Le nombre maximum de joueurs doit être entre **1 et 99**.',
      ephemeral: true,
    });
  }

  // Sauvegarder dans la session
  wizardService.updateTeam(interaction.user.id, index, { name, emoji, maxPlayers: max });
  session.teams[index] = { ...session.teams[index], name, emoji, maxPlayers: max };

  // Le modal ne peut pas faire update() → on crée une nouvelle réponse éphémère
  await interaction.deferReply({ ephemeral: true });

  const nextIndex = index + 1;

  if (nextIndex < session.teamCount) {
    // Équipe suivante à configurer
    return interaction.editReply(buildTeamConfigPayload(session, nextIndex));
  } else {
    // Toutes les équipes configurées → sélection des rôles
    return interaction.editReply(buildRoleSelectionPayload(session, 0));
  }
}

// ── Sélection du rôle Discord pour une équipe ─────────────────────────────
async function handleRoleSelect(interaction) {
  const index   = parseInt(interaction.customId.split('_')[2]);
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      ephemeral: true,
    });
  }

  const roleId = interaction.values[0];
  wizardService.setTeamRole(interaction.user.id, index, roleId);
  session.teams[index].roleId = roleId;

  const nextIndex = index + 1;

  if (nextIndex < session.teamCount) {
    return interaction.update(buildRoleSelectionPayload(session, nextIndex));
  } else {
    return interaction.update(buildRecapPayload(session));
  }
}

// ── Confirmation finale et sauvegarde ─────────────────────────────────────
async function handleConfirm(interaction) {
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      ephemeral: true,
    });
  }

  // Écraser la configuration dans data/config.json
  const config          = getConfig();
  config.teams          = session.teams;
  config.setupMessageId = ''; // reset : /setup-teams devra être relancé
  config.setupChannelId = '';
  saveConfig(config);

  wizardService.deleteSession(interaction.user.id);

  logger.success(`Configuration sauvegardée par ${interaction.user.tag} — ${session.teamCount} équipe(s)`);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('✅ Configuration sauvegardée !')
    .setDescription(
      'Les équipes ont été configurées avec succès.\n\n' +
      '👉 Lance maintenant `/setup-teams` dans le salon de ton choix pour afficher le panneau de sélection.'
    )
    .addFields(
      session.teams.map(t => ({
        name:   `${t.emoji} ${t.name}`,
        value:  `Rôle : <@&${t.roleId}>\nMax : **${t.maxPlayers}** joueurs`,
        inline: true,
      }))
    )
    .setFooter({ text: 'TeamForge' })
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: [] });
}

// ── Annulation ────────────────────────────────────────────────────────────
async function handleCancel(interaction) {
  wizardService.deleteSession(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('❌ Setup annulé')
    .setDescription('La configuration n\'a pas été modifiée.');

  return interaction.update({ embeds: [embed], components: [] });
}

// ════════════════════════════════════════════════════════════════════════════
// BUILDERS — construisent les payloads (embeds + composants)
// ════════════════════════════════════════════════════════════════════════════

// ── Étape 1 : sélection du nombre d'équipes ───────────────────────────────
function buildTeamCountPayload() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧙 Setup Wizard — Étape 1/3')
    .setDescription(
      '**Combien d\'équipes veux-tu configurer ?**\n\n' +
      'Tu pourras ensuite définir le nom, l\'emoji et le nombre de joueurs max pour chacune.'
    );

  const row = new ActionRowBuilder().addComponents(
    ...[2, 3, 4, 5, 6].map(n =>
      new ButtonBuilder()
        .setCustomId(`wizard_count_${n}`)
        .setLabel(`${n} équipes`)
        .setStyle(ButtonStyle.Primary)
    )
  );

  return { embeds: [embed], components: [row] };
}

// ── Étape 2 : configuration d'une équipe (bouton → modal) ─────────────────
function buildTeamConfigPayload(session, index) {
  const total = session.teamCount;

  // Récapitulatif des équipes déjà configurées
  const doneList = session.teams
    .slice(0, index)
    .map(t => `${t.emoji} **${t.name}** — ${t.maxPlayers} joueurs max ✅`)
    .join('\n') || '*Aucune équipe configurée pour l\'instant*';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🧙 Setup Wizard — Étape 2/3  (${index + 1}/${total})`)
    .setDescription(
      `Configure les paramètres pour l\'équipe **n°${index + 1}**.\n\n` +
      'Clique sur le bouton ci-dessous pour ouvrir le formulaire.'
    )
    .addFields({ name: '📋 Équipes déjà configurées', value: doneList });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`wizard_edit_team_${index}`)
      .setLabel(`⚙️ Configurer l'équipe ${index + 1} / ${total}`)
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

// ── Étape 3 : sélection du rôle Discord ──────────────────────────────────
function buildRoleSelectionPayload(session, index) {
  const team  = session.teams[index];
  const total = session.teamCount;

  const progression = session.teams
    .map((t, i) => {
      if (i < index)    return `${t.emoji} **${t.name}** → <@&${t.roleId}> ✅`;
      if (i === index)  return `${t.emoji} **${t.name}** ← *sélection en cours*`;
      return `${t.emoji} **${t.name}** ← *à venir*`;
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🧙 Setup Wizard — Étape 3/3  (${index + 1}/${total})`)
    .setDescription(
      `Sélectionne le **rôle Discord** à associer à **${team.emoji} ${team.name}**.\n\n` +
      '> ⚠️ Le rôle **@TeamForge** doit être **au-dessus** de ce rôle dans la hiérarchie du serveur.'
    )
    .addFields({ name: '📋 Progression', value: progression });

  const row = new ActionRowBuilder().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(`wizard_role_${index}`)
      .setPlaceholder(`Rôle pour ${team.emoji} ${team.name}`)
  );

  return { embeds: [embed], components: [row] };
}

// ── Récapitulatif final ───────────────────────────────────────────────────
function buildRecapPayload(session) {
  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('🧙 Setup Wizard — Récapitulatif')
    .setDescription(
      'Voici la configuration qui sera sauvegardée.\n\n' +
      '**Vérifie et confirme pour appliquer.**'
    )
    .addFields(
      session.teams.map(t => ({
        name:   `${t.emoji} ${t.name}`,
        value:  `Rôle : <@&${t.roleId}>\nMax : **${t.maxPlayers}** joueurs`,
        inline: true,
      }))
    )
    .setFooter({ text: '⚠️ Cette action remplacera la configuration existante.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wizard_confirm')
      .setLabel('✅ Confirmer')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('wizard_cancel')
      .setLabel('❌ Annuler')
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { handle, buildTeamCountPayload };