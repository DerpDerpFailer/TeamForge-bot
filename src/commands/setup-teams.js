const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { buildTeamButtons, buildTeamsEmbed }                      = require('../utils/teamEmbed');
const { saveSetupMessage, getConfig }                            = require('../services/configService');
const logger                                                      = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-teams')
    .setDescription('📋 Envoie le panneau de sélection des équipes dans ce salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const config = getConfig();

    if (!config.teams || config.teams.length === 0) {
      return interaction.editReply({
        content: '❌ Aucune équipe configurée. Lance d\'abord `/setup-wizard`.',
      });
    }

    try {
      const guild   = interaction.guild;
      const embed   = await buildTeamsEmbed(guild);
      const buttons = buildTeamButtons();

      const message = await interaction.channel.send({
        embeds:     [embed],
        components: [buttons],
      });

      saveSetupMessage(message.id, interaction.channel.id);

      logger.success(`Panneau envoyé par ${interaction.user.tag} dans #${interaction.channel.name}`);

      return interaction.editReply({
        content: '✅ Panneau des équipes envoyé avec succès !',
      });
    } catch (err) {
      logger.error(`Erreur /setup-teams : ${err.message}`);
      return interaction.editReply({
        content: '❌ Une erreur est survenue.',
      });
    }
  },
};
