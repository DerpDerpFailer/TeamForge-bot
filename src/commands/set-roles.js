const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { getConfig }              = require('../services/configService');
const { buildSetRolesCountPayload } = require('../handlers/setRolesHandler');
const { t }                      = require('../utils/i18n');
const logger                     = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-roles')
    .setDescription('⚙️ Configure the sub-roles available when joining a team')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const config             = getConfig();
    const hasExistingSubRoles = config.subRoles?.length > 0 && config.subRoles.some(r => r.roleId);

    // ── Config existante → demander confirmation ────────────────────────────
    if (hasExistingSubRoles) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(t('setRoles.overwriteTitle'))
        .setDescription(t('setRoles.overwriteDescription'))
        .addFields(
          config.subRoles.map(r => ({
            name:   `${r.emoji} ${r.name}`,
            value:  t('setRoles.existingField', { roleId: r.roleId }),
            inline: true,
          }))
        )
        .setFooter({ text: t('setRoles.overwriteFooter') });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('setroles_overwrite_confirm')
          .setLabel(t('setRoles.overwriteConfirm'))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('setroles_overwrite_cancel')
          .setLabel(t('setRoles.overwriteCancel'))
          .setStyle(ButtonStyle.Secondary),
      );

      return interaction.reply({
        embeds:     [embed],
        components: [row],
        flags:      MessageFlags.Ephemeral,
      });
    }

    // ── Pas de config → démarrer directement ────────────────────────────────
    const payload = buildSetRolesCountPayload();
    await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
    logger.cmd(`/set-roles started by ${interaction.user.tag}`);
  },
};
