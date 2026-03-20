const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const { getConfig, saveConfig } = require('../services/configService');
const { t }                     = require('../utils/i18n');
const logger                    = require('../utils/logger');

const SUPPORTED_LANGUAGES = {
  en: '🇬🇧 English',
  fr: '🇫🇷 Français',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-language')
    .setDescription('🌐 Change the bot language / Changer la langue du bot')
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Language / Langue')
        .setRequired(true)
        .addChoices(
          { name: '🇬🇧 English', value: 'en' },
          { name: '🇫🇷 Français', value: 'fr' },
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const newLang  = interaction.options.getString('language');
    const config   = getConfig();
    const prevLang = config.language ?? 'en';

    // Déjà configuré dans cette langue
    if (prevLang === newLang) {
      return interaction.reply({
        content: t('setLanguage.alreadySet'),
        flags:   MessageFlags.Ephemeral,
      });
    }

    // Sauvegarder la nouvelle langue
    config.language = newLang;
    saveConfig(config);

    logger.success(
      `Language changed to ${SUPPORTED_LANGUAGES[newLang]} by ${interaction.user.tag}`
    );

    // Répondre dans la NOUVELLE langue
    return interaction.reply({
      content: t('setLanguage.success'),
      flags:   MessageFlags.Ephemeral,
    });
  },
};
