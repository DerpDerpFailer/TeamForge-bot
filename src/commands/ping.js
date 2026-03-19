const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  // Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Vérifie que TeamForge est opérationnel'),

  async execute(interaction) {
    const latency    = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🏓 Pong !')
      .addFields(
        { name: '⏱️ Latence bot',  value: `${latency}ms`,    inline: true },
        { name: '📡 Latence API',  value: `${apiLatency}ms`, inline: true },
      )
      .setFooter({ text: 'TeamForge' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};