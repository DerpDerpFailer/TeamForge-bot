const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { getConfig } = require('../services/configService');
const { t }         = require('../utils/i18n');
const logger        = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-reset-time')
    .setDescription('⏰ Change the automatic team reset time'),

  async execute(interaction) {
    const config      = getConfig();
    const currentTime = config.resetTime ?? null;

    const textInput = new TextInputBuilder()
      .setCustomId('reset_time')
      .setLabel(currentTime
        ? t('setResetTime.fieldLabel', { time: currentTime })
        : t('setResetTime.fieldLabelEmpty')
      )
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(t('setResetTime.fieldPlaceholder'))
      .setMinLength(4)
      .setMaxLength(5)
      .setRequired(true);

    if (currentTime) textInput.setValue(currentTime);

    const modal = new ModalBuilder()
      .setCustomId('set_reset_time_modal')
      .setTitle(t('setResetTime.modalTitle'));

    modal.addComponents(
      new ActionRowBuilder().addComponents(textInput),
    );

    logger.cmd(`/set-reset-time opened by ${interaction.user.tag}`);
    return interaction.showModal(modal);
  },
};
