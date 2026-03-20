const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const { getConfig, saveConfig } = require('../services/configService');
const { startCron }             = require('../services/cronService');
const logger                    = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-reset-time')
    .setDescription('⏰ Modifie l\'heure du reset automatique des équipes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const config      = getConfig();
    const currentTime = config.resetTime ?? 'Non configuré';

    const modal = new ModalBuilder()
      .setCustomId('set_reset_time_modal')
      .setTitle('Heure du reset automatique');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reset_time')
          .setLabel(`Heure actuelle : ${currentTime}`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex : 03:00')
          .setValue(currentTime !== 'Non configuré' ? currentTime : '')
          .setMinLength(4)
          .setMaxLength(5)
          .setRequired(true)
      ),
    );

    logger.cmd(`/set-reset-time ouvert par ${interaction.user.tag}`);
    return interaction.showModal(modal);
  },
};
