const { Events, MessageFlags }  = require('discord.js');
const logger                     = require('../utils/logger');
const wizardHandler              = require('../handlers/wizardHandler');
const teamHandler                = require('../handlers/teamHandler');
const { buildTeamButtons, buildTeamsEmbed } = require('../utils/teamEmbed');
const { getConfig, saveSetupMessage }       = require('../services/configService');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction, client) {

    // ── Slash Commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Commande inconnue reçue : /${interaction.commandName}`);
        return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });
      }

      try {
        logger.cmd(`/${interaction.commandName} exécutée par ${interaction.user.tag}`);
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Erreur lors de /${interaction.commandName} : ${error.message}`);
        const errorMsg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      }
      return;
    }

    const customId = interaction.customId ?? '';

    // ── Modal /setup-teams — envoi du panneau ────────────────────────────────
    if (interaction.isModalSubmit() && customId === 'setup_teams_modal') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const config = getConfig();

      if (!config.teams || config.teams.length === 0) {
        return interaction.editReply({
          content: '❌ Aucune équipe configurée. Lance d\'abord `/setup-wizard`.',
        });
      }

      try {
        const title       = interaction.fields.getTextInputValue('panel_title').trim();
        const description = interaction.fields.getTextInputValue('panel_description').trim();
        const guild       = interaction.guild;

        // fetchMembers = true : premier affichage, peuple le cache
        const embed   = await buildTeamsEmbed(guild, true, title, description);
        const buttons = buildTeamButtons();

        const message = await interaction.channel.send({
          embeds:     [embed],
          components: buttons,
        });

        saveSetupMessage(message.id, interaction.channel.id);

        logger.success(`Panneau envoyé par ${interaction.user.tag} dans #${interaction.channel.name}`);

        return interaction.editReply({ content: '✅ Panneau des équipes envoyé avec succès !' });
      } catch (err) {
        logger.error(`Erreur setup_teams_modal : ${err.message}`);
        return interaction.editReply({ content: '❌ Une erreur est survenue.' });
      }
    }

    // ── Interactions du wizard ───────────────────────────────────────────────
    if (customId.startsWith('wizard_')) {
      try {
        await wizardHandler.handle(interaction);
      } catch (err) {
        logger.error(`Erreur wizard [${customId}] : ${err.message}`);
        const msg = { content: '❌ Une erreur est survenue dans le wizard.', flags: MessageFlags.Ephemeral };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
          } else {
            await interaction.reply(msg);
          }
        } catch (_) { /* interaction expirée */ }
      }
      return;
    }

    // ── Boutons des équipes (team_X) et quitter (team_leave) ────────────────
    if (interaction.isButton() && customId.startsWith('team_')) {
      try {
        await teamHandler.handle(interaction);
      } catch (err) {
        logger.error(`Erreur teamHandler [${customId}] : ${err.message}`);
        const msg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
          } else {
            await interaction.reply(msg);
          }
        } catch (_) { /* interaction expirée */ }
      }
      return;
    }
  },
};
