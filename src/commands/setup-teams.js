const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-teams')
    .setDescription('📋 Envoie le panneau de sélection des équipes dans ce salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // ── Ouvrir le modal pour personnaliser titre et description ─────────────
    const modal = new ModalBuilder()
      .setCustomId('setup_teams_modal')
      .setTitle('Personnaliser le panneau');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_title')
          .setLabel('Titre du panneau')
          .setStyle(TextInputStyle.Short)
          .setValue('⚔️ TeamForge — Sélection des équipes')
          .setMaxLength(100)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setValue(
            'Clique sur un bouton pour rejoindre une équipe.\n' +
            'Tu ne peux appartenir qu\'à une seule équipe à la fois.\n' +
            'Clique sur 🚪 Quitter mon équipe pour te retirer.'
          )
          .setMaxLength(500)
          .setRequired(true)
      ),
    );

    logger.cmd(`/setup-teams modal ouvert par ${interaction.user.tag}`);
    return interaction.showModal(modal);
  },
};
