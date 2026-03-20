const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig }           = require('../services/configService');
const { refreshSetupMessage } = require('../handlers/teamHandler');
const { t }                   = require('../utils/i18n');
const logger                  = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-teams')
    .setDescription('🔄 Remove all Team roles from all members'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const config = getConfig();
    const guild  = interaction.guild;

    if (!config.teams || config.teams.length === 0) {
      return interaction.editReply({ content: t('resetTeams.noTeams') });
    }

    try {
      await guild.members.fetch();
      let totalRemoved = 0;

      for (const team of config.teams) {
        if (!team.roleId) continue;
        const role = await guild.roles.fetch(team.roleId).catch(() => null);
        if (!role) continue;

        for (const [, member] of role.members) {
          await member.roles.remove(team.roleId).catch(err => {
            logger.error(`Unable to remove ${team.name} from ${member.user.tag}: ${err.message}`);
          });
          totalRemoved++;
        }
      }

      await refreshSetupMessage(guild, config);

      logger.success(t('resetTeams.logSuccess', { user: interaction.user.tag, count: totalRemoved }));

      return interaction.editReply({
        content: t('resetTeams.success', { count: totalRemoved }),
      });
    } catch (err) {
      logger.error(`Error /reset-teams: ${err.message}`);
      return interaction.editReply({ content: t('general.error') });
    }
  },
};
