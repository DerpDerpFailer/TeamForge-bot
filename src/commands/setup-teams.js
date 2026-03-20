const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { t }    = require('../utils/i18n');
const logger   = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-teams')
    .setDescription('📋 Send the team selection panel in this channel'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('setup_teams_modal')
      .setTitle(t('setupTeams.modalTitle'));

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_title')
          .setLabel(t('setupTeams.fieldTitle'))
          .setStyle(TextInputStyle.Short)
          .setValue(t('embed.title'))
          .setMaxLength(100)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_description')
          .setLabel(t('setupTeams.fieldDescription'))
          .setStyle(TextInputStyle.Paragraph)
          .setValue(t('embed.description'))
          .setMaxLength(500)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_role_name')
          .setLabel(t('setupTeams.fieldRoleName'))
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(t('setupTeams.fieldRolePlaceholder'))
          .setRequired(false)
      ),
    );

    logger.cmd(`/setup-teams modal opened by ${interaction.user.tag}`);
    return interaction.showModal(modal);
  },
};
