const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { getConfig }               = require('../services/configService');
const { buildTeamCountPayload }   = require('../handlers/wizardHandler');
const logger                      = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-wizard')
    .setDescription('🧙 Configure les équipes TeamForge')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const config            = getConfig();
    const hasExistingConfig = config.teams?.length > 0 && config.teams.some(t => t.roleId);

    // ── Config existante → demander confirmation avant d'écraser ────────────
    if (hasExistingConfig) {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('⚠️ Configuration existante détectée')
        .setDescription(
          'Une configuration d\'équipes est déjà en place.\n\n' +
          '**Veux-tu l\'écraser et tout reconfigurer ?**'
        )
        .addFields(
          config.teams.map(t => ({
            name:   `${t.emoji} ${t.name}`,
            value:  `Rôle : <@&${t.roleId}>\nMax : ${t.maxPlayers} joueurs`,
            inline: true,
          }))
        )
        .setFooter({ text: '⚠️ Cette action est irréversible.' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('wizard_overwrite_confirm')
          .setLabel('🗑️ Écraser et reconfigurer')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('wizard_overwrite_cancel')
          .setLabel('↩️ Annuler')
          .setStyle(ButtonStyle.Secondary),
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // ── Pas de config → démarrer le wizard directement ──────────────────────
    const payload = buildTeamCountPayload();
    await interaction.reply({ ...payload, ephemeral: true });
    logger.cmd(`Setup wizard lancé par ${interaction.user.tag}`);
  },
};