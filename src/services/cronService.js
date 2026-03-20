const cron    = require('node-cron');
const logger  = require('../utils/logger');
const { getConfig }           = require('./configService');
const { refreshSetupMessage } = require('../handlers/teamHandler');

// Instance du cron actif (une seule à la fois)
let currentTask = null;

/**
 * Démarre (ou redémarre) le cron de reset quotidien.
 * Si un cron est déjà actif, il est arrêté avant d'en créer un nouveau.
 *
 * @param {Client} client     - Le client Discord
 * @param {string} resetTime  - Heure au format HH:MM (ex: "03:00")
 */
function startCron(client, resetTime) {
  // Arrêter le cron existant si besoin
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    logger.info('Ancien cron de reset arrêté');
  }

  if (!resetTime) {
    logger.warn('Aucune heure de reset configurée — cron non démarré');
    return;
  }

  const [hour, minute] = resetTime.split(':').map(Number);

  if (isNaN(hour) || isNaN(minute)) {
    logger.error(`Heure de reset invalide : ${resetTime}`);
    return;
  }

  // Expression cron : "MM HH * * *"
  const expression = `${minute} ${hour} * * *`;

  currentTask = cron.schedule(expression, async () => {
    logger.info(`⏰ Reset automatique des équipes (${resetTime})`);

    const config = getConfig();
    const guild  = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);

    if (!guild) {
      logger.error('Reset cron : serveur introuvable');
      return;
    }

    try {
      await guild.members.fetch();

      let totalRemoved = 0;

      for (const team of config.teams) {
        if (!team.roleId) continue;

        const role = guild.roles.cache.get(team.roleId);
        if (!role) continue;

        for (const [, member] of role.members) {
          await member.roles.remove(team.roleId).catch(err => {
            logger.error(`Reset cron : impossible de retirer ${team.name} à ${member.user.tag} : ${err.message}`);
          });
          totalRemoved++;
        }
      }

      await refreshSetupMessage(guild, config);

      logger.success(`Reset automatique terminé — ${totalRemoved} rôle(s) retirés`);
    } catch (err) {
      logger.error(`Erreur lors du reset automatique : ${err.message}`);
    }
  }, {
    timezone: 'Europe/Paris', // fuseau horaire FR
  });

  logger.success(`Cron de reset démarré — tous les jours à ${resetTime} (Europe/Paris)`);
}

/**
 * Arrête le cron actif s'il existe
 */
function stopCron() {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    logger.info('Cron de reset arrêté');
  }
}

module.exports = { startCron, stopCron };
