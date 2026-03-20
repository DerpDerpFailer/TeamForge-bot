const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig }           = require('../services/configService');
const { refreshSetupMessage } = require('../handlers/teamHandler');
const logger                  = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teams-status')
    .setDescription('🔁 Force le rafraîchissement du panneau des équipes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const config = getConfig();
    const guild  = interaction.guild;

    if (!config.setupMessageId) {
      return interaction.editReply({
        content: '❌ Aucun panneau actif. Lance `/setup-teams` d\'abord.',
      });
    }

    try {
      await refreshSetupMessage(guild, config);
      logger.success(`Panneau rafraîchi manuellement par ${interaction.user.tag}`);
      return interaction.editReply({ content: '✅ Panneau rafraîchi avec succès !' });
    } catch (err) {
      logger.error(`Erreur /teams-status : ${err.message}`);
      return interaction.editReply({ content: '❌ Une erreur est survenue.' });
    }
  },
};
