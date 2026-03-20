module.exports = {

  // ── Général ──────────────────────────────────────────────────────────────
  general: {
    error:          '❌ Une erreur est survenue.',
    unauthorized:   '❌ Tu n\'as pas la permission d\'utiliser cette commande.',
    sessionExpired: '❌ Session expirée. Relance `/setup-wizard`.',
    unknownTeam:    '❌ Équipe introuvable.',
    unknownCommand: '❌ Commande introuvable.',
  },

  // ── Ping ─────────────────────────────────────────────────────────────────
  ping: {
    title:      '🏓 Pong !',
    botLatency: '⏱️ Latence bot',
    apiLatency: '📡 Latence API',
    footer:     'TeamForge',
  },

  // ── Team embed ────────────────────────────────────────────────────────────
  embed: {
    title:           '⚔️ TeamForge — Sélection des équipes',
    description:     'Clique sur un bouton pour rejoindre une équipe.\nTu ne peux appartenir qu\'à **une seule équipe** à la fois.\nClique sur 🚪 **Quitter mon équipe** pour te retirer.',
    noMembers:       '*Aucun membre*',
    roleNotSet:      '⚙️ Rôle non configuré',
    roleNotFound:    '❌ Rôle introuvable',
    footer:          'TeamForge • Mis à jour',
    leaveButton:     '🚪 Quitter mon équipe',
  },

  // ── Setup Teams ───────────────────────────────────────────────────────────
  setupTeams: {
    modalTitle:           'Personnaliser le panneau',
    fieldTitle:           'Titre du panneau',
    fieldDescription:     'Description',
    fieldRoleName:        'Nom du rôle à mentionner (optionnel)',
    fieldRolePlaceholder: 'Ex : @everyone  ou  Joueurs  —  Laisser vide pour ignorer',
    noTeamsConfigured:    '❌ Aucune équipe configurée. Lance d\'abord `/setup-wizard`.',
    roleNotFound:         '❌ Rôle `{role}` introuvable. Vérifie le nom et réessaie.',
    success:              '✅ Panneau des équipes envoyé avec succès !',
    logSent:              'Panneau envoyé par {user} dans #{channel}',
  },

  // ── Team Handler ──────────────────────────────────────────────────────────
  teamHandler: {
    alreadyInTeam:    '✅ Tu es déjà dans **{emoji} {name}** !',
    roleNotFound:     '❌ Le rôle de cette équipe est introuvable. Contacte un administrateur.',
    teamFull:         '❌ **{emoji} {name}** est complète ! ({current}/{max})',
    roleAddError:     '❌ Impossible d\'ajouter le rôle. Vérifie la hiérarchie des rôles.',
    joinSuccess:      '✅ Tu as rejoint **{emoji} {name}** !',
    leaveNoTeam:      '❌ Tu ne fais partie d\'aucune équipe.',
    leaveRoleError:   '❌ Impossible de te retirer de l\'équipe. Vérifie la hiérarchie des rôles.',
    leaveSuccess:     '✅ Tu as quitté {team} !',
    logJoined:        '{user} a rejoint {emoji} {name}',
    logLeft:          '{user} a quitté {team}',
    logRefreshed:     'Panneau des équipes mis à jour',
    logRefreshError:  'Impossible de rafraîchir le panneau : {error}',
  },

  // ── Reset Teams ───────────────────────────────────────────────────────────
  resetTeams: {
    noTeams:    '❌ Aucune équipe configurée.',
    success:    '✅ Reset effectué ! **{count}** rôle(s) Team retirés.',
    logSuccess: 'Reset effectué par {user} — {count} rôle(s) retirés',
  },

  // ── Teams Status ──────────────────────────────────────────────────────────
  teamsStatus: {
    noPanel:    '❌ Aucun panneau actif. Lance `/setup-teams` d\'abord.',
    success:    '✅ Panneau rafraîchi avec succès !',
    logSuccess: 'Panneau rafraîchi manuellement par {user}',
  },

  // ── Set Reset Time ────────────────────────────────────────────────────────
  setResetTime: {
    modalTitle:      'Heure du reset automatique',
    fieldLabel:      'Heure actuelle : {time}',
    fieldLabelEmpty: 'Heure du reset (HH:MM)',
    fieldPlaceholder:'Ex : 03:00',
    invalidFormat:   '❌ Format invalide. Utilise **HH:MM** (ex: `03:00`, `14:30`).',
    invalidTime:     '❌ Heure invalide. Heures : 0–23, Minutes : 0–59.',
    success:         '✅ Reset automatique configuré à **{time}** (Europe/Paris) !',
    logSuccess:      'Heure de reset modifiée par {user} → {time}',
  },

  // ── Set Language ──────────────────────────────────────────────────────────
  setLanguage: {
    modalTitle:   'Langue du bot',
    success:      '✅ Langue définie sur **Français** 🇫🇷',
    alreadySet:   'ℹ️ Le bot est déjà en **Français**.',
    logSuccess:   'Langue changée en {lang} par {user}',
  },

  // ── Cron ──────────────────────────────────────────────────────────────────
  cron: {
    started:      'Cron de reset démarré — tous les jours à {time} (Europe/Paris)',
    stopped:      'Cron de reset arrêté',
    noTime:       'Aucune heure de reset configurée — lance /setup-wizard ou /set-reset-time',
    invalidTime:  'Heure de reset invalide : {time}',
    resetting:    '⏰ Reset automatique des équipes ({time})',
    guildError:   'Reset cron : serveur introuvable',
    success:      'Reset automatique terminé — {count} rôle(s) retirés',
    error:        'Erreur lors du reset automatique : {error}',
  },

  // ── Wizard ────────────────────────────────────────────────────────────────
  wizard: {
    // Étape overwrite
    overwriteTitle:       '⚠️ Configuration existante détectée',
    overwriteDescription: 'Une configuration d\'équipes est déjà en place.\n\n**Veux-tu l\'écraser et tout reconfigurer ?**',
    overwriteFooter:      '⚠️ Cette action est irréversible.',
    overwriteConfirm:     '🗑️ Écraser et reconfigurer',
    overwriteCancel:      '↩️ Annuler',

    // Étape 1
    step1Title:       '🧙 Setup Wizard — Étape 1/4',
    step1Description: '**Combien d\'équipes veux-tu configurer ?**\n\nClique sur le bouton ci-dessous et entre un nombre entre **1 et 12**.',
    step1Button:      '⚙️ Définir le nombre d\'équipes',
    countModalTitle:  'Nombre d\'équipes',
    countLabel:       'Nombre d\'équipes (1 à 12)',
    countPlaceholder: 'Ex : 4',
    countInvalid:     '❌ Le nombre d\'équipes doit être entre **1 et 12**.',

    // Étape 2
    step2Title:        '🧙 Setup Wizard — Étape 2/4  ({index}/{total})',
    step2Description:  'Configure les paramètres pour l\'équipe **n°{index}**.\n\nClique sur le bouton ci-dessous pour ouvrir le formulaire.',
    step2DoneList:     '📋 Équipes déjà configurées',
    step2NoDone:       '*Aucune équipe configurée pour l\'instant*',
    step2Button:       '⚙️ Configurer l\'équipe {index} / {total}',
    teamModalTitle:    'Équipe {index} / {total}',
    teamNameLabel:     'Nom de l\'équipe',
    teamEmojiLabel:    'Emoji  (ex: 🔴  🔵  🟢  ⚡  💀)',
    teamMaxLabel:      'Nombre maximum de joueurs (1–99)',
    teamMaxInvalid:    '❌ Le nombre maximum de joueurs doit être entre **1 et 99**.',

    // Étape 3
    step3Title:        '🧙 Setup Wizard — Étape 3/4  ({index}/{total})',
    step3Description:  'Sélectionne le **rôle Discord** à associer à **{emoji} {name}**.\n\n> ⚠️ Le rôle **@TeamForge** doit être **au-dessus** de ce rôle dans la hiérarchie du serveur.',
    step3Progress:     '📋 Progression',
    step3Done:         '{emoji} **{name}** → <@&{roleId}> ✅',
    step3Current:      '{emoji} **{name}** ← *sélection en cours*',
    step3Pending:      '{emoji} **{name}** ← *à venir*',
    step3Placeholder:  'Rôle pour {emoji} {name}',

    // Étape 4
    step4Title:        '🧙 Setup Wizard — Étape 4/4',
    step4Description:  '**À quelle heure veux-tu réinitialiser les équipes chaque jour ?**\n\nClique sur le bouton pour définir l\'heure au format **HH:MM**.',
    step4CurrentTime:  '⏰ Heure actuelle',
    step4NotSet:       '*Non définie*',
    step4Button:       '⏰ Définir l\'heure de reset',
    step4ModalTitle:   'Heure du reset automatique',
    step4Label:        'Heure du reset quotidien (HH:MM)',
    step4Placeholder:  'Ex : 03:00',
    step4Invalid:      '❌ Format invalide. Utilise **HH:MM** (ex: `03:00`, `14:30`).',

    // Récap
    recapTitle:        '🧙 Setup Wizard — Récapitulatif',
    recapDescription:  'Voici la configuration qui sera sauvegardée.\n\n**Vérifie et confirme pour appliquer.**',
    recapRoleField:    'Rôle : <@&{roleId}>\nMax : **{max}** joueurs',
    recapResetField:   '⏰ Reset automatique',
    recapResetValue:   'Tous les jours à **{time}** (Europe/Paris)',
    recapFooter:       '⚠️ Cette action remplacera la configuration existante.',
    recapConfirm:      '✅ Confirmer',
    recapCancel:       '❌ Annuler',

    // Confirmation
    confirmTitle:       '✅ Configuration sauvegardée !',
    confirmDescription: 'Les équipes ont été configurées avec succès.\n\n👉 Lance maintenant `/setup-teams` dans le salon de ton choix pour afficher le panneau de sélection.',
    confirmRoleField:   'Rôle : <@&{roleId}>\nMax : **{max}** joueurs',
    confirmResetField:  '⏰ Reset automatique',
    confirmResetValue:  'Tous les jours à **{time}** (Europe/Paris)',
    confirmFooter:      'TeamForge',
    logSuccess:         'Configuration sauvegardée par {user} — {count} équipe(s) — reset à {time}',

    // Annulation
    cancelTitle:       '❌ Setup annulé',
    cancelDescription: 'La configuration n\'a pas été modifiée.',

    // Config existante
    existingRoleField: 'Rôle : <@&{roleId}>\nMax : {max} joueurs',
  },
};
