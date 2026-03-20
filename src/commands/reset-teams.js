const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getConfig }           = require('../services/configService');
const { refreshSetupMessage } = require('../handlers/teamHandler');
const logger                  = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-teams')
    .setDescription('🔄 Retire tous les rôles Team de tous les membres')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const config = getConfig();
    const guild  = interaction.guild;

    if (!config.teams || config.teams.length === 0) {
      return interaction.editReply({ content: '❌ Aucune équipe configurée.' });
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
            logger.error(`Impossible de retirer ${team.name} à ${member.user.tag} : ${err.message}`);
          });
          totalRemoved++;
        }
      }

      await refreshSetupMessage(guild, config);

      logger.success(`Reset effectué par ${interaction.user.tag} — ${totalRemoved} rôle(s) retirés`);

      return interaction.editReply({
        content: `✅ Reset effectué ! **${totalRemoved}** rôle(s) Team retirés.`,
      });
    } catch (err) {
      logger.error(`Erreur /reset-teams : ${err.message}`);
      return interaction.editReply({ content: '❌ Une erreur est survenue.' });
    }
  },
};
