const { Events, MessageFlags }              = require('discord.js');
const logger                                 = require('../utils/logger');
const wizardHandler                          = require('../handlers/wizardHandler');
const teamHandler                            = require('../handlers/teamHandler');
const { buildTeamButtons, buildTeamsEmbed }  = require('../utils/teamEmbed');
const { getConfig, saveSetupMessage, saveConfig } = require('../services/configService');
const { startCron }                          = require('../services/cronService');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction, client) {

    // ── Slash Commands ───────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Commande inconnue reçue : /${interaction.commandName}`);
        return interaction.reply({ content: '❌ Commande introuvable.', flags: MessageFlags.Ephemeral });
      }

      try {
        logger.cmd(`/${interaction.commandName} exécutée par ${interaction.user.tag}`);
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Erreur lors de /${interaction.commandName} : ${error.message}`);
        const errorMsg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
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
        return interaction.editReply({
          content: '❌ Aucune équipe configurée. Lance d\'abord `/setup-wizard`.',
        });
      }

      try {
        const title       = interaction.fields.getTextInputValue('panel_title').trim();
        const description = interaction.fields.getTextInputValue('panel_description').trim();
        const roleNameRaw = interaction.fields.getTextInputValue('panel_role_name').trim();
        const guild       = interaction.guild;

        // ── Résolution du rôle par son nom ──────────────────────────────────
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
                content: `❌ Rôle \`${roleNameRaw}\` introuvable. Vérifie le nom et réessaie.`,
              });
            }

            roleMention = `<@&${role.id}>`;
            logger.info(`Mention du rôle : ${role.name} (${role.id})`);
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

        logger.success(`Panneau envoyé par ${interaction.user.tag} dans #${interaction.channel.name}`);

        return interaction.editReply({ content: '✅ Panneau des équipes envoyé avec succès !' });
      } catch (err) {
        logger.error(`Erreur setup_teams_modal : ${err.message}`);
        return interaction.editReply({ content: '❌ Une erreur est survenue.' });
      }
    }

    // ── Modal /set-reset-time ────────────────────────────────────────────────
    if (interaction.isModalSubmit() && customId === 'set_reset_time_modal') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const raw = interaction.fields.getTextInputValue('reset_time').trim();

      // Validation HH:MM
      if (!/^\d{1,2}:\d{2}$/.test(raw)) {
        return interaction.editReply({
          content: '❌ Format invalide. Utilise **HH:MM** (ex: `03:00`, `14:30`).',
        });
      }

      const [h, m] = raw.split(':').map(Number);
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        return interaction.editReply({
          content: '❌ Heure invalide. Heures : 0–23, Minutes : 0–59.',
        });
      }

      // Sauvegarder dans config.json
      const config     = getConfig();
      config.resetTime = raw;
      saveConfig(config);

      // Redémarrer le cron
      startCron(client, raw);

      logger.success(`Heure de reset modifiée par ${interaction.user.tag} → ${raw}`);

      return interaction.editReply({
        content: `✅ Reset automatique configuré à **${raw}** (Europe/Paris) !`,
      });
    }

    // ── Interactions du wizard ───────────────────────────────────────────────
    if (customId.startsWith('wizard_')) {
      // Bouton spécial : ouvrir modal heure de reset (étape 4)
      if (interaction.isButton() && customId === 'wizard_reset_time_open_modal') {
        try {
          await wizardHandler.handleResetTimeModal(interaction);
        } catch (err) {
          logger.error(`Erreur wizard reset time modal : ${err.message}`);
        }
        return;
      }

      try {
        await wizardHandler.handle(interaction);
      } catch (err) {
        logger.error(`Erreur wizard [${customId}] : ${err.message}`);
        const msg = { content: '❌ Une erreur est survenue dans le wizard.', flags: MessageFlags.Ephemeral };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
          } else {
            await interaction.reply(msg);
          }
        } catch (_) { /* interaction expirée */ }
      }
      return;
    }

    // ── Boutons des équipes ──────────────────────────────────────────────────
    if (interaction.isButton() && customId.startsWith('team_')) {
      try {
        await teamHandler.handle(interaction);
      } catch (err) {
        logger.error(`Erreur teamHandler [${customId}] : ${err.message}`);
        const msg = { content: '❌ Une erreur est survenue.', flags: MessageFlags.Ephemeral };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
          } else {
            await interaction.reply(msg);
          }
        } catch (_) { /* interaction expirée */ }
      }
      return;
    }
  },
};
