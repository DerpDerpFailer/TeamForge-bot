const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig }           = require('../services/configService');
const { refreshSetupMessage } = require('../handlers/teamHandler');
const { t }                   = require('../utils/i18n');
const logger                  = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teams-status')
    .setDescription('🔁 Force refresh the team panel'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const config = getConfig();
    const guild  = interaction.guild;

    if (!config.setupMessageId) {
      return interaction.editReply({ content: t('teamsStatus.noPanel') });
    }

    try {
      await refreshSetupMessage(guild, config);
      logger.success(t('teamsStatus.logSuccess', { user: interaction.user.tag }));
      return interaction.editReply({ content: t('teamsStatus.success') });
    } catch (err) {
      logger.error(`Error /teams-status: ${err.message}`);
      return interaction.editReply({ content: t('general.error') });
    }
  },
};
