const { Events } = require('discord.js');
const logger        = require('../utils/logger');
const wizardHandler = require('../handlers/wizardHandler');
const teamHandler   = require('../handlers/teamHandler');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction, client) {

    // ── Slash Commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Commande inconnue reçue : /${interaction.commandName}`);
        return interaction.reply({ content: '❌ Commande introuvable.', flags: 64 });
      }

      try {
        logger.cmd(`/${interaction.commandName} exécutée par ${interaction.user.tag}`);
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Erreur lors de /${interaction.commandName} : ${error.message}`);
        const errorMsg = { content: '❌ Une erreur est survenue.', flags: 64 };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      }
      return;
    }

    const customId = interaction.customId ?? '';

    // ── Interactions du wizard ───────────────────────────────────────────────
    if (customId.startsWith('wizard_')) {
      try {
        await wizardHandler.handle(interaction);
      } catch (err) {
        logger.error(`Erreur wizard [${customId}] : ${err.message}`);
        const msg = { content: '❌ Une erreur est survenue dans le wizard.', flags: 64 };
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
        const msg = { content: '❌ Une erreur est survenue.', flags: 64 };
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
