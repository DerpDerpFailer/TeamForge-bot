const { Events, MessageFlags }              = require('discord.js');
const logger                                 = require('../utils/logger');
const wizardHandler                          = require('../handlers/wizardHandler');
const teamHandler                            = require('../handlers/teamHandler');
const { buildTeamButtons, buildTeamsEmbed }  = require('../utils/teamEmbed');
const { getConfig, saveSetupMessage, saveConfig } = require('../services/configService');
const { startCron }                          = require('../services/cronService');
const { t }                                  = require('../utils/i18n');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction, client) {

    // ── Slash Commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Unknown command received: /${interaction.commandName}`);
        return interaction.reply({ content: t('general.unknownCommand'), flags: MessageFlags.Ephemeral });
      }

      try {
        logger.cmd(`/${interaction.commandName} executed by ${interaction.user.tag}`);
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Error on /${interaction.commandName}: ${error.message}`);
        const errorMsg = { content: t('general.error'), flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      }
      return;
    }

    const customId = interaction.customId ?? '';

    // ── Modal /setup-teams ───────────────────────────────────────────────────
    if (interaction.isModalSubmit() && customId === 'setup_teams_modal') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const config = getConfig();

      if (!config.teams || config.teams.length === 0) {
        return interaction.editReply({ content: t('setupTeams.noTeamsConfigured') });
      }

      try {
        const title       = interaction.fields.getTextInputValue('panel_title').trim();
        const description = interaction.fields.getTextInputValue('panel_description').trim();
        const roleNameRaw = interaction.fields.getTextInputValue('panel_role_name').trim();
        const guild       = interaction.guild;

        let roleMention = null;

        if (roleNameRaw) {
          const roleName = roleNameRaw.replace(/^@/, '').trim();

          if (roleName.toLowerCase() === 'everyone') {
            roleMention = '@everyone';
          } else {
            await guild.roles.fetch();
            const role = guild.roles.cache.find(
              r => r.name.toLowerCase() === roleName.toLowerCase()
            );

            if (!role) {
              return interaction.editReply({
                content: t('setupTeams.roleNotFound', { role: roleNameRaw }),
              });
            }

            roleMention = `<@&${role.id}>`;
            logger.info(`Role mention: ${role.name} (${role.id})`);
          }
        }

        const embed   = await buildTeamsEmbed(guild, true, title, description);
        const buttons = buildTeamButtons();

        const message = await interaction.channel.send({
          content:    roleMention ?? undefined,
          embeds:     [embed],
          components: buttons,
        });

        saveSetupMessage(message.id, interaction.channel.id);
        logger.success(t('setupTeams.logSent', { user: interaction.user.tag, channel: interaction.channel.name }));

        return interaction.editReply({ content: t('setupTeams.success') });
      } catch (err) {
        logger.error(`Error setup_teams_modal: ${err.message}`);
        return interaction.editReply({ content: t('general.error') });
      }
    }

    // ── Modal /set-reset-time ────────────────────────────────────────────────
    if (interaction.isModalSubmit() && customId === 'set_reset_time_modal') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const raw = interaction.fields.getTextInputValue('reset_time').trim();

      if (!/^\d{1,2}:\d{2}$/.test(raw)) {
        return interaction.editReply({ content: t('setResetTime.invalidFormat') });
      }

      const [h, m] = raw.split(':').map(Number);
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        return interaction.editReply({ content: t('setResetTime.invalidTime') });
      }

      const config     = getConfig();
      config.resetTime = raw;
      saveConfig(config);
      startCron(client, raw);

      logger.success(t('setResetTime.logSuccess', { user: interaction.user.tag, time: raw }));

      return interaction.editReply({ content: t('setResetTime.success', { time: raw }) });
    }

    // ── Interactions du wizard ───────────────────────────────────────────────
    if (customId.startsWith('wizard_')) {
      if (interaction.isButton() && customId === 'wizard_reset_time_open_modal') {
        try {
          await wizardHandler.handleResetTimeModal(interaction);
        } catch (err) {
          logger.error(`Error wizard reset time modal: ${err.message}`);
        }
        return;
      }

      try {
        await wizardHandler.handle(interaction);
      } catch (err) {
        logger.error(`Error wizard [${customId}]: ${err.message}`);
        const msg = { content: t('general.error'), flags: MessageFlags.Ephemeral };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
          } else {
            await interaction.reply(msg);
          }
        } catch (_) { /* expired */ }
      }
      return;
    }

    // ── Boutons des équipes ──────────────────────────────────────────────────
    if (interaction.isButton() && customId.startsWith('team_')) {
      try {
        await teamHandler.handle(interaction);
      } catch (err) {
        logger.error(`Error teamHandler [${customId}]: ${err.message}`);
        const msg = { content: t('general.error'), flags: MessageFlags.Ephemeral };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
          } else {
            await interaction.reply(msg);
          }
        } catch (_) { /* expired */ }
      }
      return;
    }
  },
};
