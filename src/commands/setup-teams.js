const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildTeamButtons, buildTeamsEmbed }        = require('../utils/teamEmbed');
const { saveSetupMessage }                          = require('../../data/configService');
const logger                                        = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-teams')
    .setDescription('⚙️ Envoie le panneau de sélection des équipes')
    // Réservé aux admins uniquement
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Différer la réponse (le bot a besoin de temps pour fetch les membres)
    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;

      // Construire l'embed et les boutons
      const embed   = await buildTeamsEmbed(guild);
      const buttons = buildTeamButtons();

      // Envoyer le message dans le salon courant
      const message = await interaction.channel.send({
        embeds:     [embed],
        components: [buttons],
      });

      // Sauvegarder l'ID du message et du channel dans config.json
      saveSetupMessage(message.id, interaction.channel.id);

      logger.success(`Panneau setup-teams envoyé par ${interaction.user.tag} dans #${interaction.channel.name}`);

      await interaction.editReply({
        content: '✅ Panneau des équipes envoyé avec succès !',
      });

    } catch (err) {
      logger.error(`Erreur /setup-teams : ${err.message}`);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de l\'envoi du panneau.',
      });
    }
  },
};
```

---

## ⚙️ Avant de tester — Créer les rôles Discord

Il faut créer les rôles **Team 1**, **Team 2**, **Team 3** sur ton serveur :
```
Paramètres du serveur → Rôles → Créer un rôle