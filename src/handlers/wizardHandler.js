const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  RoleSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');

const wizardService               = require('../services/wizardService');
const { getConfig, saveConfig }   = require('../services/configService');
const { startCron }               = require('../services/cronService');
const logger                      = require('../utils/logger');

// ════════════════════════════════════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════════════════════════════════════
async function handle(interaction) {

  if (interaction.isButton()) {
    const id = interaction.customId;

    if (id === 'wizard_overwrite_confirm')  return handleOverwriteConfirm(interaction);
    if (id === 'wizard_overwrite_cancel')   return handleCancel(interaction);
    if (id === 'wizard_count_open_modal')   return handleCountModal(interaction);
    if (id.startsWith('wizard_edit_team_')) return handleEditTeam(interaction);
    if (id === 'wizard_confirm')            return handleConfirm(interaction);
    if (id === 'wizard_cancel')             return handleCancel(interaction);
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'wizard_count_modal')         return handleCountModalSubmit(interaction);
    if (interaction.customId.startsWith('wizard_team_modal_')) return handleTeamModalSubmit(interaction);
    if (interaction.customId === 'wizard_reset_time_modal')    return handleResetTimeModalSubmit(interaction);
  }

  if (interaction.isRoleSelectMenu()) {
    if (interaction.customId.startsWith('wizard_role_')) {
      return handleRoleSelect(interaction);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════════════════════════

async function handleOverwriteConfirm(interaction) {
  wizardService.deleteSession(interaction.user.id);
  return interaction.update(buildTeamCountPayload());
}

async function handleCountModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('wizard_count_modal')
    .setTitle('Nombre d\'équipes');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_count')
        .setLabel('Nombre d\'équipes (1 à 12)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(2)
        .setPlaceholder('Ex : 4')
        .setRequired(true)
    )
  );

  return interaction.showModal(modal);
}

async function handleCountModalSubmit(interaction) {
  const raw   = interaction.fields.getTextInputValue('team_count').trim();
  const count = parseInt(raw);

  if (isNaN(count) || count < 1 || count > 12) {
    return interaction.reply({
      content: '❌ Le nombre d\'équipes doit être entre **1 et 12**.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  const session = wizardService.createSession(interaction.user.id, count);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  return interaction.editReply(buildTeamConfigPayload(session, 0));
}

async function handleEditTeam(interaction) {
  const index   = parseInt(interaction.customId.split('_')[3]);
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      flags:   MessageFlags.Ephemeral,
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

  return interaction.showModal(modal);
}

async function handleTeamModalSubmit(interaction) {
  const index   = parseInt(interaction.customId.split('_')[3]);
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  const name   = interaction.fields.getTextInputValue('team_name').trim();
  const emoji  = interaction.fields.getTextInputValue('team_emoji').trim();
  const maxRaw = interaction.fields.getTextInputValue('team_max').trim();
  const max    = parseInt(maxRaw);

  if (isNaN(max) || max < 1 || max > 99) {
    return interaction.reply({
      content: '❌ Le nombre maximum de joueurs doit être entre **1 et 99**.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  wizardService.updateTeam(interaction.user.id, index, { name, emoji, maxPlayers: max });
  session.teams[index] = { ...session.teams[index], name, emoji, maxPlayers: max };

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const nextIndex = index + 1;

  if (nextIndex < session.teamCount) {
    return interaction.editReply(buildTeamConfigPayload(session, nextIndex));
  } else {
    return interaction.editReply(buildRoleSelectionPayload(session, 0));
  }
}

async function handleRoleSelect(interaction) {
  const index   = parseInt(interaction.customId.split('_')[2]);
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  const roleId = interaction.values[0];
  wizardService.setTeamRole(interaction.user.id, index, roleId);
  session.teams[index].roleId = roleId;

  const nextIndex = index + 1;

  if (nextIndex < session.teamCount) {
    return interaction.update(buildRoleSelectionPayload(session, nextIndex));
  } else {
    // Toutes les équipes ont un rôle → étape 4 : heure de reset
    return interaction.update(buildResetTimePayload(session));
  }
}

// ── Étape 4 : ouverture du modal heure de reset ───────────────────────────
async function handleResetTimeModal(interaction) {
  const session = wizardService.getSession(interaction.user.id);

  const modal = new ModalBuilder()
    .setCustomId('wizard_reset_time_modal')
    .setTitle('Heure du reset automatique');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reset_time')
        .setLabel('Heure du reset quotidien (HH:MM)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex : 03:00')
        .setValue(session?.resetTime ?? '03:00')
        .setMinLength(4)
        .setMaxLength(5)
        .setRequired(true)
    ),
  );

  return interaction.showModal(modal);
}

// ── Étape 4 : traitement du modal heure de reset ──────────────────────────
async function handleResetTimeModalSubmit(interaction) {
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  const raw = interaction.fields.getTextInputValue('reset_time').trim();

  // Validation format HH:MM
  if (!isValidTime(raw)) {
    return interaction.reply({
      content: '❌ Format invalide. Utilise **HH:MM** (ex: `03:00`, `14:30`).',
      flags:   MessageFlags.Ephemeral,
    });
  }

  session.resetTime = raw;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  return interaction.editReply(buildRecapPayload(session));
}

// ── Confirmation finale ───────────────────────────────────────────────────
async function handleConfirm(interaction) {
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ Session expirée. Relance `/setup-wizard`.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  const config          = getConfig();
  config.teams          = session.teams;
  config.resetTime      = session.resetTime;
  config.setupMessageId = '';
  config.setupChannelId = '';
  saveConfig(config);

  // Redémarrer le cron avec la nouvelle heure
  const client = interaction.client;
  startCron(client, config.resetTime);

  wizardService.deleteSession(interaction.user.id);

  logger.success(`Configuration sauvegardée par ${interaction.user.tag} — ${session.teamCount} équipe(s) — reset à ${session.resetTime}`);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('✅ Configuration sauvegardée !')
    .setDescription(
      'Les équipes ont été configurées avec succès.\n\n' +
      '👉 Lance maintenant `/setup-teams` dans le salon de ton choix pour afficher le panneau de sélection.'
    )
    .addFields(
      ...session.teams.map(t => ({
        name:   `${t.emoji} ${t.name}`,
        value:  `Rôle : <@&${t.roleId}>\nMax : **${t.maxPlayers}** joueurs`,
        inline: true,
      })),
      {
        name:   '⏰ Reset automatique',
        value:  `Tous les jours à **${session.resetTime}** (Europe/Paris)`,
        inline: false,
      }
    )
    .setFooter({ text: 'TeamForge' })
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: [] });
}

async function handleCancel(interaction) {
  wizardService.deleteSession(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('❌ Setup annulé')
    .setDescription('La configuration n\'a pas été modifiée.');

  return interaction.update({ embeds: [embed], components: [] });
}

// ════════════════════════════════════════════════════════════════════════════
// BUILDERS
// ════════════════════════════════════════════════════════════════════════════

function buildTeamCountPayload() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧙 Setup Wizard — Étape 1/4')
    .setDescription(
      '**Combien d\'équipes veux-tu configurer ?**\n\n' +
      'Clique sur le bouton ci-dessous et entre un nombre entre **1 et 12**.'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wizard_count_open_modal')
      .setLabel('⚙️ Définir le nombre d\'équipes')
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildTeamConfigPayload(session, index) {
  const total = session.teamCount;

  const doneList = session.teams
    .slice(0, index)
    .map(t => `${t.emoji} **${t.name}** — ${t.maxPlayers} joueurs max ✅`)
    .join('\n') || '*Aucune équipe configurée pour l\'instant*';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🧙 Setup Wizard — Étape 2/4  (${index + 1}/${total})`)
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

function buildRoleSelectionPayload(session, index) {
  const team  = session.teams[index];
  const total = session.teamCount;

  const progression = session.teams
    .map((t, i) => {
      if (i < index)   return `${t.emoji} **${t.name}** → <@&${t.roleId}> ✅`;
      if (i === index) return `${t.emoji} **${t.name}** ← *sélection en cours*`;
      return `${t.emoji} **${t.name}** ← *à venir*`;
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🧙 Setup Wizard — Étape 3/4  (${index + 1}/${total})`)
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

// ── Étape 4 : payload avec bouton → ouvre modal heure ────────────────────
function buildResetTimePayload(session) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧙 Setup Wizard — Étape 4/4')
    .setDescription(
      '**À quelle heure veux-tu réinitialiser les équipes chaque jour ?**\n\n' +
      'Clique sur le bouton pour définir l\'heure au format **HH:MM**.'
    )
    .addFields({
      name:  '⏰ Heure actuelle',
      value: session.resetTime ? `**${session.resetTime}** (Europe/Paris)` : '*Non définie*',
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wizard_reset_time_open_modal')
      .setLabel('⏰ Définir l\'heure de reset')
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildRecapPayload(session) {
  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('🧙 Setup Wizard — Récapitulatif')
    .setDescription(
      'Voici la configuration qui sera sauvegardée.\n\n' +
      '**Vérifie et confirme pour appliquer.**'
    )
    .addFields(
      ...session.teams.map(t => ({
        name:   `${t.emoji} ${t.name}`,
        value:  `Rôle : <@&${t.roleId}>\nMax : **${t.maxPlayers}** joueurs`,
        inline: true,
      })),
      {
        name:   '⏰ Reset automatique',
        value:  `Tous les jours à **${session.resetTime}** (Europe/Paris)`,
        inline: false,
      }
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

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Valide le format HH:MM
 */
function isValidTime(str) {
  if (!/^\d{1,2}:\d{2}$/.test(str)) return false;
  const [h, m] = str.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

module.exports = { handle, buildTeamCountPayload, handleResetTimeModal };
