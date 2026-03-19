require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const logger         = require('./src/utils/logger');
const commandHandler = require('./src/handlers/commandHandler');
const eventHandler   = require('./src/handlers/eventHandler');

// ── Vérification des variables d'environnement ──────────────────────────────
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Variable d'environnement manquante : ${envVar}`);
    process.exit(1);
  }
}

// ── Création du client Discord ───────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// ── Collection pour stocker les commandes ───────────────────────────────────
client.commands = new Collection();

// ── Chargement des handlers ──────────────────────────────────────────────────
commandHandler(client);
eventHandler(client);

// ── Connexion à Discord ──────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN)
  .then(() => logger.info('Connexion à Discord en cours...'))
  .catch((err) => {
    logger.error(`Impossible de se connecter : ${err.message}`);
    process.exit(1);
  });