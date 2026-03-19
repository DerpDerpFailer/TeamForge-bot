const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction, client) {

    // ── Slash Commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Commande inconnue reçue : /${interaction.commandName}`);
        return interaction.reply({
          content: '❌ Commande introuvable.',
          ephemeral: true,
        });
      }

      try {
        logger.cmd(`/${interaction.commandName} exécutée par ${interaction.user.tag}`);
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Erreur lors de /${interaction.commandName} : ${error.message}`);

        const errorMsg = { content: '❌ Une erreur est survenue.', ephemeral: true };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      }
      return;
    }

    // ── Boutons (géré dans les prochaines étapes) ────────────────────────────
    if (interaction.isButton()) {
      // À compléter — Étape 4
      return;
    }
  },
};