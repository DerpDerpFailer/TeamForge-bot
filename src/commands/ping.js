const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Check that TeamForge is operational'),

  async execute(interaction) {
    const latency    = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(t('ping.title'))
      .addFields(
        { name: t('ping.botLatency'), value: `${latency}ms`,    inline: true },
        { name: t('ping.apiLatency'), value: `${apiLatency}ms`, inline: true },
      )
      .setFooter({ text: t('ping.footer') })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
