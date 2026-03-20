const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { getConfig } = require('../services/configService');
const logger        = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-reset-time')
    .setDescription('⏰ Modifie l\'heure du reset automatique des équipes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const config      = getConfig();
    const currentTime = config.resetTime ?? null;

    const textInput = new TextInputBuilder()
      .setCustomId('reset_time')
      .setLabel(currentTime ? `Heure actuelle : ${currentTime}` : 'Heure du reset (HH:MM)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex : 03:00')
      .setMinLength(4)
      .setMaxLength(5)
      .setRequired(true);

    // Ne définir setValue que si une valeur existe déjà
    if (currentTime) {
      textInput.setValue(currentTime);
    }

    const modal = new ModalBuilder()
      .setCustomId('set_reset_time_modal')
      .setTitle('Heure du reset automatique');

    modal.addComponents(
      new ActionRowBuilder().addComponents(textInput),
    );

    logger.cmd(`/set-reset-time ouvert par ${interaction.user.tag}`);
    return interaction.showModal(modal);
  },
};
