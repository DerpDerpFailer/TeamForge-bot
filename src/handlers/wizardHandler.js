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

const wizardService             = require('../services/wizardService');
const { getConfig, saveConfig } = require('../services/configService');
const { startCron }             = require('../services/cronService');
const { t }                     = require('../utils/i18n');
const logger                    = require('../utils/logger');

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
    if (interaction.customId.startsWith('wizard_role_')) return handleRoleSelect(interaction);
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
    .setTitle(t('wizard.countModalTitle'));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_count')
        .setLabel(t('wizard.countLabel'))
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(2)
        .setPlaceholder(t('wizard.countPlaceholder'))
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
      content: t('wizard.countInvalid'),
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
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const team = session.teams[index];

  const modal = new ModalBuilder()
    .setCustomId(`wizard_team_modal_${index}`)
    .setTitle(t('wizard.teamModalTitle', { index: index + 1, total: session.teamCount }));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_name')
        .setLabel(t('wizard.teamNameLabel'))
        .setStyle(TextInputStyle.Short)
        .setValue(team.name)
        .setMaxLength(32)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_emoji')
        .setLabel(t('wizard.teamEmojiLabel'))
        .setStyle(TextInputStyle.Short)
        .setValue(team.emoji)
        .setMaxLength(8)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('team_max')
        .setLabel(t('wizard.teamMaxLabel'))
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
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const name   = interaction.fields.getTextInputValue('team_name').trim();
  const emoji  = interaction.fields.getTextInputValue('team_emoji').trim();
  const maxRaw = interaction.fields.getTextInputValue('team_max').trim();
  const max    = parseInt(maxRaw);

  if (isNaN(max) || max < 1 || max > 99) {
    return interaction.reply({ content: t('wizard.teamMaxInvalid'), flags: MessageFlags.Ephemeral });
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
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const roleId = interaction.values[0];
  wizardService.setTeamRole(interaction.user.id, index, roleId);
  session.teams[index].roleId = roleId;

  const nextIndex = index + 1;
  if (nextIndex < session.teamCount) {
    return interaction.update(buildRoleSelectionPayload(session, nextIndex));
  } else {
    return interaction.update(buildResetTimePayload(session));
  }
}

async function handleResetTimeModal(interaction) {
  const session = wizardService.getSession(interaction.user.id);

  const modal = new ModalBuilder()
    .setCustomId('wizard_reset_time_modal')
    .setTitle(t('wizard.step4ModalTitle'));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reset_time')
        .setLabel(t('wizard.step4Label'))
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(t('wizard.step4Placeholder'))
        .setValue(session?.resetTime ?? '03:00')
        .setMinLength(4)
        .setMaxLength(5)
        .setRequired(true)
    ),
  );

  return interaction.showModal(modal);
}

async function handleResetTimeModalSubmit(interaction) {
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const raw = interaction.fields.getTextInputValue('reset_time').trim();

  if (!isValidTime(raw)) {
    return interaction.reply({ content: t('wizard.step4Invalid'), flags: MessageFlags.Ephemeral });
  }

  session.resetTime = raw;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  return interaction.editReply(buildRecapPayload(session));
}

async function handleConfirm(interaction) {
  const session = wizardService.getSession(interaction.user.id);

  if (!session) {
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const config          = getConfig();
  config.teams          = session.teams;
  config.resetTime      = session.resetTime;
  config.setupMessageId = '';
  config.setupChannelId = '';
  saveConfig(config);

  startCron(interaction.client, config.resetTime);
  wizardService.deleteSession(interaction.user.id);

  logger.success(t('wizard.logSuccess', {
    user:  interaction.user.tag,
    count: session.teamCount,
    time:  session.resetTime,
  }));

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(t('wizard.confirmTitle'))
    .setDescription(t('wizard.confirmDescription'))
    .addFields(
      ...session.teams.map(tm => ({
        name:   `${tm.emoji} ${tm.name}`,
        value:  t('wizard.confirmRoleField', { roleId: tm.roleId, max: tm.maxPlayers }),
        inline: true,
      })),
      {
        name:   t('wizard.confirmResetField'),
        value:  t('wizard.confirmResetValue', { time: session.resetTime }),
        inline: false,
      }
    )
    .setFooter({ text: t('wizard.confirmFooter') })
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: [] });
}

async function handleCancel(interaction) {
  wizardService.deleteSession(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(t('wizard.cancelTitle'))
    .setDescription(t('wizard.cancelDescription'));

  return interaction.update({ embeds: [embed], components: [] });
}

// ════════════════════════════════════════════════════════════════════════════
// BUILDERS
// ════════════════════════════════════════════════════════════════════════════

function buildTeamCountPayload() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('wizard.step1Title'))
    .setDescription(t('wizard.step1Description'));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wizard_count_open_modal')
      .setLabel(t('wizard.step1Button'))
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildTeamConfigPayload(session, index) {
  const total    = session.teamCount;
  const doneList = session.teams
    .slice(0, index)
    .map(tm => `${tm.emoji} **${tm.name}** — ${tm.maxPlayers} ✅`)
    .join('\n') || t('wizard.step2NoDone');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('wizard.step2Title', { index: index + 1, total }))
    .setDescription(t('wizard.step2Description', { index: index + 1 }))
    .addFields({ name: t('wizard.step2DoneList'), value: doneList });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`wizard_edit_team_${index}`)
      .setLabel(t('wizard.step2Button', { index: index + 1, total }))
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildRoleSelectionPayload(session, index) {
  const team  = session.teams[index];
  const total = session.teamCount;

  const progression = session.teams
    .map((tm, i) => {
      if (i < index)   return t('wizard.step3Done',    { emoji: tm.emoji, name: tm.name, roleId: tm.roleId });
      if (i === index) return t('wizard.step3Current', { emoji: tm.emoji, name: tm.name });
      return t('wizard.step3Pending', { emoji: tm.emoji, name: tm.name });
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('wizard.step3Title', { index: index + 1, total }))
    .setDescription(t('wizard.step3Description', { emoji: team.emoji, name: team.name }))
    .addFields({ name: t('wizard.step3Progress'), value: progression });

  const row = new ActionRowBuilder().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(`wizard_role_${index}`)
      .setPlaceholder(t('wizard.step3Placeholder', { emoji: team.emoji, name: team.name }))
  );

  return { embeds: [embed], components: [row] };
}

function buildResetTimePayload(session) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('wizard.step4Title'))
    .setDescription(t('wizard.step4Description'))
    .addFields({
      name:  t('wizard.step4CurrentTime'),
      value: session.resetTime
        ? `**${session.resetTime}** (Europe/Paris)`
        : t('wizard.step4NotSet'),
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wizard_reset_time_open_modal')
      .setLabel(t('wizard.step4Button'))
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildRecapPayload(session) {
  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle(t('wizard.recapTitle'))
    .setDescription(t('wizard.recapDescription'))
    .addFields(
      ...session.teams.map(tm => ({
        name:   `${tm.emoji} ${tm.name}`,
        value:  t('wizard.recapRoleField', { roleId: tm.roleId, max: tm.maxPlayers }),
        inline: true,
      })),
      {
        name:   t('wizard.recapResetField'),
        value:  t('wizard.recapResetValue', { time: session.resetTime }),
        inline: false,
      }
    )
    .setFooter({ text: t('wizard.recapFooter') });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('wizard_confirm')
      .setLabel(t('wizard.recapConfirm'))
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('wizard_cancel')
      .setLabel(t('wizard.recapCancel'))
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row] };
}

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

function isValidTime(str) {
  if (!/^\d{1,2}:\d{2}$/.test(str)) return false;
  const [h, m] = str.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

module.exports = { handle, buildTeamCountPayload, handleResetTimeModal };
