const fs   = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Charge automatiquement tous les événements du dossier /events
 * Supporte : once (exécuté une fois) et on (exécuté à chaque fois)
 */
module.exports = (client) => {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  let loaded = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event    = require(filePath);

    if (!event.name || !event.execute) {
      logger.warn(`Événement ignoré (structure invalide) : ${file}`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    logger.event(`Événement chargé : ${event.name}`);
    loaded++;
  }

  logger.success(`${loaded} événement(s) chargé(s)`);
};