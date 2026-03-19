require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

// ── Vérification des variables d'environnement ──────────────────────────────
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  logger.error('Variables manquantes : DISCORD_TOKEN, CLIENT_ID ou GUILD_ID');
  process.exit(1);
}

// ── Chargement des commandes ─────────────────────────────────────────────────
const commands    = [];
const commandsPath = path.join(__dirname, '../src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
    logger.cmd(`Commande préparée : /${command.data.name}`);
  }
}

// ── Déploiement via l'API REST Discord ──────────────────────────────────────
const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`Déploiement de ${commands.length} commande(s)...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    logger.success(`${data.length} commande(s) déployée(s) avec succès !`);
  } catch (error) {
    logger.error(`Échec du déploiement : ${error.message}`);
    process.exit(1);
  }
})();