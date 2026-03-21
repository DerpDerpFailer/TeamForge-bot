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

const { getConfig, saveConfig } = require('../services/configService');
const wizardService             = require('../services/wizardService');
const { t }                     = require('../utils/i18n');
const logger                    = require('../utils/logger');

// Session key prefix pour différencier du wizard teams
const SESSION_KEY = (userId) => `setroles_${userId}`;

// ════════════════════════════════════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════════════════════════════════════
async function handle(interaction) {

  if (interaction.isButton()) {
    const id = interaction.customId;
    if (id === 'setroles_overwrite_confirm')   return handleOverwriteConfirm(interaction);
    if (id === 'setroles_overwrite_cancel')    return handleCancel(interaction);
    if (id === 'setroles_count_open_modal')    return handleCountModal(interaction);
    if (id.startsWith('setroles_edit_'))       return handleEditSubRole(interaction);
    if (id === 'setroles_confirm')             return handleConfirm(interaction);
    if (id === 'setroles_cancel')              return handleCancel(interaction);
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'setroles_count_modal')         return handleCountModalSubmit(interaction);
    if (interaction.customId.startsWith('setroles_modal_'))      return handleSubRoleModalSubmit(interaction);
  }

  if (interaction.isRoleSelectMenu()) {
    if (interaction.customId.startsWith('setroles_role_'))       return handleRoleSelect(interaction);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════════════════════════

async function handleOverwriteConfirm(interaction) {
  const key = SESSION_KEY(interaction.user.id);
  wizardService.deleteSession(key);
  return interaction.update(buildSetRolesCountPayload());
}

async function handleCountModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('setroles_count_modal')
    .setTitle(t('setRoles.countModalTitle'));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('sub_role_count')
        .setLabel(t('setRoles.countLabel'))
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(1)
        .setPlaceholder(t('setRoles.countPlaceholder'))
        .setRequired(true)
    )
  );

  return interaction.showModal(modal);
}

async function handleCountModalSubmit(interaction) {
  const raw   = interaction.fields.getTextInputValue('sub_role_count').trim();
  const count = parseInt(raw);

  if (isNaN(count) || count < 1 || count > 5) {
    return interaction.reply({
      content: t('setRoles.countInvalid'),
      flags:   MessageFlags.Ephemeral,
    });
  }

  const key     = SESSION_KEY(interaction.user.id);
  const session = {
    count,
    subRoles: Array.from({ length: count }, (_, i) => ({
      id:     i + 1,
      name:   `Role ${i + 1}`,
      emoji:  '⚔️',
      roleId: '',
    })),
  };
  wizardService.createSession(key, count);

  // Stocker la session manuellement (wizardService stocke teams, on adapte)
  // On utilise une Map locale pour les sessions set-roles
  setRolesSessions.set(interaction.user.id, session);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  return interaction.editReply(buildConfigPayload(session, 0));
}

async function handleEditSubRole(interaction) {
  const index   = parseInt(interaction.customId.split('_')[2]);
  const session = setRolesSessions.get(interaction.user.id);

  if (!session) {
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const subRole = session.subRoles[index];

  const modal = new ModalBuilder()
    .setCustomId(`setroles_modal_${index}`)
    .setTitle(t('setRoles.modalTitle', { index: index + 1, total: session.count }));

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('subrole_name')
        .setLabel(t('setRoles.nameLabel'))
        .setStyle(TextInputStyle.Short)
        .setValue(subRole.name)
        .setMaxLength(32)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('subrole_emoji')
        .setLabel(t('setRoles.emojiLabel'))
        .setStyle(TextInputStyle.Short)
        .setValue(subRole.emoji)
        .setMaxLength(8)
        .setRequired(true)
    ),
  );

  return interaction.showModal(modal);
}

async function handleSubRoleModalSubmit(interaction) {
  const index   = parseInt(interaction.customId.split('_')[2]);
  const session = setRolesSessions.get(interaction.user.id);

  if (!session) {
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const name  = interaction.fields.getTextInputValue('subrole_name').trim();
  const emoji = interaction.fields.getTextInputValue('subrole_emoji').trim();

  if (!name || !emoji) {
    return interaction.reply({ content: t('setRoles.maxInvalid'), flags: MessageFlags.Ephemeral });
  }

  session.subRoles[index] = { ...session.subRoles[index], name, emoji };

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const nextIndex = index + 1;
  if (nextIndex < session.count) {
    return interaction.editReply(buildConfigPayload(session, nextIndex));
  } else {
    return interaction.editReply(buildRoleSelectPayload(session, 0));
  }
}

async function handleRoleSelect(interaction) {
  const index   = parseInt(interaction.customId.split('_')[2]);
  const session = setRolesSessions.get(interaction.user.id);

  if (!session) {
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  session.subRoles[index].roleId = interaction.values[0];

  const nextIndex = index + 1;
  if (nextIndex < session.count) {
    return interaction.update(buildRoleSelectPayload(session, nextIndex));
  } else {
    return interaction.update(buildRecapPayload(session));
  }
}

async function handleConfirm(interaction) {
  const session = setRolesSessions.get(interaction.user.id);

  if (!session) {
    return interaction.reply({ content: t('general.sessionExpired'), flags: MessageFlags.Ephemeral });
  }

  const config       = getConfig();
  config.subRoles    = session.subRoles;
  saveConfig(config);

  setRolesSessions.delete(interaction.user.id);

  logger.success(t('setRoles.logSuccess', { user: interaction.user.tag, count: session.count }));

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(t('setRoles.confirmTitle'))
    .setDescription(t('setRoles.confirmDescription'))
    .addFields(
      session.subRoles.map(r => ({
        name:   `${r.emoji} ${r.name}`,
        value:  t('setRoles.confirmField', { roleId: r.roleId }),
        inline: true,
      }))
    )
    .setFooter({ text: t('setRoles.confirmFooter') })
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: [] });
}

async function handleCancel(interaction) {
  setRolesSessions.delete(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(t('setRoles.cancelTitle'))
    .setDescription(t('setRoles.cancelDescription'));

  return interaction.update({ embeds: [embed], components: [] });
}

// ════════════════════════════════════════════════════════════════════════════
// BUILDERS
// ════════════════════════════════════════════════════════════════════════════

function buildSetRolesCountPayload() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('setRoles.step1Title'))
    .setDescription(t('setRoles.step1Description'));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('setroles_count_open_modal')
      .setLabel(t('setRoles.step1Button'))
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildConfigPayload(session, index) {
  const total    = session.count;
  const doneList = session.subRoles
    .slice(0, index)
    .map(r => `${r.emoji} **${r.name}** ✅`)
    .join('\n') || t('setRoles.step2NoDone');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('setRoles.step2Title', { index: index + 1, total }))
    .setDescription(t('setRoles.step2Description', { index: index + 1 }))
    .addFields({ name: t('setRoles.step2DoneList'), value: doneList });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`setroles_edit_${index}`)
      .setLabel(t('setRoles.step2Button', { index: index + 1, total }))
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildRoleSelectPayload(session, index) {
  const subRole = session.subRoles[index];
  const total   = session.count;

  const progression = session.subRoles
    .map((r, i) => {
      if (i < index)   return t('setRoles.step3Done',    { emoji: r.emoji, name: r.name, roleId: r.roleId });
      if (i === index) return t('setRoles.step3Current', { emoji: r.emoji, name: r.name });
      return t('setRoles.step3Pending', { emoji: r.emoji, name: r.name });
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(t('setRoles.step3Title', { index: index + 1, total }))
    .setDescription(t('setRoles.step3Description', { emoji: subRole.emoji, name: subRole.name }))
    .addFields({ name: t('setRoles.step3Progress'), value: progression });

  const row = new ActionRowBuilder().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(`setroles_role_${index}`)
      .setPlaceholder(t('setRoles.step3Placeholder', { emoji: subRole.emoji, name: subRole.name }))
  );

  return { embeds: [embed], components: [row] };
}

function buildRecapPayload(session) {
  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle(t('setRoles.recapTitle'))
    .setDescription(t('setRoles.recapDescription'))
    .addFields(
      session.subRoles.map(r => ({
        name:   `${r.emoji} ${r.name}`,
        value:  t('setRoles.recapField', { roleId: r.roleId }),
        inline: true,
      }))
    )
    .setFooter({ text: t('setRoles.recapFooter') });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('setroles_confirm')
      .setLabel(t('setRoles.recapConfirm'))
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('setroles_cancel')
      .setLabel(t('setRoles.recapCancel'))
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row] };
}

// ════════════════════════════════════════════════════════════════════════════
// SESSION STORE (séparé du wizard teams)
// ════════════════════════════════════════════════════════════════════════════
const setRolesSessions = new Map();

module.exports = { handle, buildSetRolesCountPayload };
