const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const { getConfig }             = require('../services/configService');
const { buildTeamCountPayload } = require('../handlers/wizardHandler');
const { t }                     = require('../utils/i18n');
const logger                    = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-wizard')
    .setDescription('🧙 Configure TeamForge teams'),

  async execute(interaction) {
    const config            = getConfig();
    const hasExistingConfig = config.teams?.length > 0 && config.teams.some(t => t.roleId);

    if (hasExistingConfig) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(t('wizard.overwriteTitle'))
        .setDescription(t('wizard.overwriteDescription'))
        .addFields(
          config.teams.map(team => ({
            name:   `${team.emoji} ${team.name}`,
            value:  t('wizard.existingRoleField', { roleId: team.roleId, max: team.maxPlayers }),
            inline: true,
          }))
        )
        .setFooter({ text: t('wizard.overwriteFooter') });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('wizard_overwrite_confirm')
          .setLabel(t('wizard.overwriteConfirm'))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('wizard_overwrite_cancel')
          .setLabel(t('wizard.overwriteCancel'))
          .setStyle(ButtonStyle.Secondary),
      );

      return interaction.reply({
        embeds:     [embed],
        components: [row],
        flags:      MessageFlags.Ephemeral,
      });
    }

    const payload = buildTeamCountPayload();
    await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
    logger.cmd(`Setup wizard started by ${interaction.user.tag}`);
  },
};
