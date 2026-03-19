const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true, // S'exécute une seule fois au démarrage

  execute(client) {
    logger.success(`Bot connecté en tant que : ${client.user.tag}`);
    logger.info(`Serveur ciblé (GUILD_ID) : ${process.env.GUILD_ID}`);
    logger.info(`Commandes enregistrées : ${client.commands.size}`);

    // Statut du bot visible dans Discord
    client.user.setPresence({
      activities: [{ name: '⚔️ TeamForge', type: ActivityType.Watching }],
      status: 'online',
    });

    logger.success('TeamForge est prêt !');
  },
};