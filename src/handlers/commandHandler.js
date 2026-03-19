const fs   = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Charge automatiquement toutes les commandes du dossier /commands
 * et les enregistre dans client.commands (Collection discord.js)
 */
module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  let loaded = 0;

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command  = require(filePath);

    // Vérification : la commande doit avoir "data" et "execute"
    if (!command.data || !command.execute) {
      logger.warn(`Commande ignorée (structure invalide) : ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
    logger.cmd(`Commande chargée : /${command.data.name}`);
    loaded++;
  }

  logger.success(`${loaded} commande(s) chargée(s)`);
};