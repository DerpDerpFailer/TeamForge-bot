const cron   = require('node-cron');
const logger = require('../utils/logger');
const { getConfig, clearAllMemberSubRoles } = require('./configService');
const { refreshSetupMessage }               = require('../handlers/teamHandler');
const { t }                                 = require('../utils/i18n');

let currentTask = null;

function startCron(client, resetTime) {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    logger.info(t('cron.stopped'));
  }

  if (!resetTime) {
    logger.warn(t('cron.noTime'));
    return;
  }

  const [hour, minute] = resetTime.split(':').map(Number);

  if (isNaN(hour) || isNaN(minute)) {
    logger.error(t('cron.invalidTime', { time: resetTime }));
    return;
  }

  const expression = `${minute} ${hour} * * *`;

  currentTask = cron.schedule(expression, async () => {
    logger.info(t('cron.resetting', { time: resetTime }));

    const config = getConfig();
    const guild  = await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);

    if (!guild) {
      logger.error(t('cron.guildError'));
      return;
    }

    try {
      await guild.members.fetch();
      let totalRemoved = 0;

      // ── Retirer les rôles Team ───────────────────────────────────────────
      for (const team of config.teams) {
        if (!team.roleId) continue;
        const role = guild.roles.cache.get(team.roleId);
        if (!role) continue;

        for (const [, member] of role.members) {
          await member.roles.remove(team.roleId).catch(err => {
            logger.error(`Cron: unable to remove ${team.name} from ${member.user.tag}: ${err.message}`);
          });
          totalRemoved++;
        }
      }

      // ── Retirer les rôles sous-rôles Discord ────────────────────────────
      for (const subRole of (config.subRoles ?? [])) {
        if (!subRole.roleId) continue;
        const role = guild.roles.cache.get(subRole.roleId);
        if (!role) continue;

        for (const [, member] of role.members) {
          await member.roles.remove(subRole.roleId).catch(() => {});
        }
      }

      // ── Effacer tous les sous-rôles persistés ────────────────────────────
      clearAllMemberSubRoles();

      await refreshSetupMessage(guild, config);

      logger.success(t('cron.success', { count: totalRemoved }));
    } catch (err) {
      logger.error(t('cron.error', { error: err.message }));
    }
  }, {
    timezone: 'Europe/Paris',
  });

  logger.success(t('cron.started', { time: resetTime }));
}

function stopCron() {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    logger.info(t('cron.stopped'));
  }
}

module.exports = { startCron, stopCron };
