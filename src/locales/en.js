module.exports = {

  // ── Général ──────────────────────────────────────────────────────────────
  general: {
    error:          '❌ An error occurred.',
    unauthorized:   '❌ You do not have permission to use this command.',
    sessionExpired: '❌ Session expired. Run `/setup-wizard` again.',
    unknownTeam:    '❌ Team not found.',
    unknownCommand: '❌ Command not found.',
  },

  // ── Ping ─────────────────────────────────────────────────────────────────
  ping: {
    title:      '🏓 Pong!',
    botLatency: '⏱️ Bot latency',
    apiLatency: '📡 API latency',
    footer:     'TeamForge',
  },

  // ── Team embed ────────────────────────────────────────────────────────────
  embed: {
    title:           '⚔️ TeamForge — Team Selection',
    description:     'Click a button to join a team.\nYou can only belong to **one team** at a time.\nClick 🚪 **Leave my team** to remove yourself.',
    noMembers:       '*No members*',
    roleNotSet:      '⚙️ Role not configured',
    roleNotFound:    '❌ Role not found',
    footer:          'TeamForge • Updated',
    leaveButton:     '🚪 Leave my team',
  },

  // ── Setup Teams ───────────────────────────────────────────────────────────
  setupTeams: {
    modalTitle:           'Customize the panel',
    fieldTitle:           'Panel title',
    fieldDescription:     'Description',
    fieldRoleName:        'Role to mention (optional)',
    fieldRolePlaceholder: 'Ex: @everyone  or  Players  —  Leave empty to ignore',
    noTeamsConfigured:    '❌ No teams configured. Run `/setup-wizard` first.',
    roleNotFound:         '❌ Role `{role}` not found. Check the name and try again.',
    success:              '✅ Team panel sent successfully!',
    logSent:              'Panel sent by {user} in #{channel}',
  },

  // ── Team Handler ──────────────────────────────────────────────────────────
  teamHandler: {
    alreadyInTeam:    '✅ You are already in **{emoji} {name}**!',
    roleNotFound:     '❌ This team\'s role could not be found. Contact an administrator.',
    teamFull:         '❌ **{emoji} {name}** is full! ({current}/{max})',
    roleAddError:     '❌ Unable to add role. Check the role hierarchy.',
    joinSuccess:      '✅ You joined **{emoji} {name}**!',
    leaveNoTeam:      '❌ You are not in any team.',
    leaveRoleError:   '❌ Unable to remove your role. Check the role hierarchy.',
    leaveSuccess:     '✅ You left {team}!',
    logJoined:        '{user} joined {emoji} {name}',
    logLeft:          '{user} left {team}',
    logRefreshed:     'Team panel updated',
    logRefreshError:  'Unable to refresh panel: {error}',
  },

  // ── Reset Teams ───────────────────────────────────────────────────────────
  resetTeams: {
    noTeams:    '❌ No teams configured.',
    success:    '✅ Reset complete! **{count}** role(s) removed.',
    logSuccess: 'Reset by {user} — {count} role(s) removed',
  },

  // ── Teams Status ──────────────────────────────────────────────────────────
  teamsStatus: {
    noPanel:    '❌ No active panel. Run `/setup-teams` first.',
    success:    '✅ Panel refreshed successfully!',
    logSuccess: 'Panel manually refreshed by {user}',
  },

  // ── Set Reset Time ────────────────────────────────────────────────────────
  setResetTime: {
    modalTitle:      'Automatic reset time',
    fieldLabel:      'Current time: {time}',
    fieldLabelEmpty: 'Reset time (HH:MM)',
    fieldPlaceholder:'Ex: 03:00',
    invalidFormat:   '❌ Invalid format. Use **HH:MM** (e.g. `03:00`, `14:30`).',
    invalidTime:     '❌ Invalid time. Hours: 0–23, Minutes: 0–59.',
    success:         '✅ Automatic reset set to **{time}** (Europe/Paris)!',
    logSuccess:      'Reset time changed by {user} → {time}',
  },

  // ── Set Language ──────────────────────────────────────────────────────────
  setLanguage: {
    modalTitle:   'Bot language',
    success:      '✅ Language set to **English** 🇬🇧',
    alreadySet:   'ℹ️ The bot is already in **English**.',
    logSuccess:   'Language changed to {lang} by {user}',
  },

  // ── Cron ──────────────────────────────────────────────────────────────────
  cron: {
    started:      'Cron started — every day at {time} (Europe/Paris)',
    stopped:      'Cron stopped',
    noTime:       'No reset time configured — run /setup-wizard or /set-reset-time',
    invalidTime:  'Invalid reset time: {time}',
    resetting:    '⏰ Automatic team reset ({time})',
    guildError:   'Cron reset: server not found',
    success:      'Automatic reset complete — {count} role(s) removed',
    error:        'Error during automatic reset: {error}',
  },

  // ── Wizard ────────────────────────────────────────────────────────────────
  wizard: {
    // Étape overwrite
    overwriteTitle:       '⚠️ Existing configuration detected',
    overwriteDescription: 'A team configuration is already in place.\n\n**Do you want to overwrite and reconfigure everything?**',
    overwriteFooter:      '⚠️ This action is irreversible.',
    overwriteConfirm:     '🗑️ Overwrite and reconfigure',
    overwriteCancel:      '↩️ Cancel',

    // Étape 1
    step1Title:       '🧙 Setup Wizard — Step 1/4',
    step1Description: '**How many teams do you want to configure?**\n\nClick the button below and enter a number between **1 and 12**.',
    step1Button:      '⚙️ Set number of teams',
    countModalTitle:  'Number of teams',
    countLabel:       'Number of teams (1 to 12)',
    countPlaceholder: 'e.g. 4',
    countInvalid:     '❌ Number of teams must be between **1 and 12**.',

    // Étape 2
    step2Title:        '🧙 Setup Wizard — Step 2/4  ({index}/{total})',
    step2Description:  'Configure the parameters for team **#{index}**.\n\nClick the button below to open the form.',
    step2DoneList:     '📋 Already configured teams',
    step2NoDone:       '*No teams configured yet*',
    step2Button:       '⚙️ Configure team {index} / {total}',
    teamModalTitle:    'Team {index} / {total}',
    teamNameLabel:     'Team name',
    teamEmojiLabel:    'Emoji  (e.g. 🔴  🔵  🟢  ⚡  💀)',
    teamMaxLabel:      'Maximum number of players (1–99)',
    teamMaxInvalid:    '❌ Maximum number of players must be between **1 and 99**.',

    // Étape 3
    step3Title:        '🧙 Setup Wizard — Step 3/4  ({index}/{total})',
    step3Description:  'Select the **Discord role** to associate with **{emoji} {name}**.\n\n> ⚠️ The **@TeamForge** role must be **above** this role in the server hierarchy.',
    step3Progress:     '📋 Progress',
    step3Done:         '{emoji} **{name}** → <@&{roleId}> ✅',
    step3Current:      '{emoji} **{name}** ← *selecting...*',
    step3Pending:      '{emoji} **{name}** ← *upcoming*',
    step3Placeholder:  'Role for {emoji} {name}',

    // Étape 4
    step4Title:        '🧙 Setup Wizard — Step 4/4',
    step4Description:  '**At what time do you want to reset teams every day?**\n\nClick the button to set the time in **HH:MM** format.',
    step4CurrentTime:  '⏰ Current time',
    step4NotSet:       '*Not set*',
    step4Button:       '⏰ Set reset time',
    step4ModalTitle:   'Automatic reset time',
    step4Label:        'Daily reset time (HH:MM)',
    step4Placeholder:  'e.g. 03:00',
    step4Invalid:      '❌ Invalid format. Use **HH:MM** (e.g. `03:00`, `14:30`).',

    // Récap
    recapTitle:        '🧙 Setup Wizard — Summary',
    recapDescription:  'Here is the configuration that will be saved.\n\n**Review and confirm to apply.**',
    recapRoleField:    'Role: <@&{roleId}>\nMax: **{max}** players',
    recapResetField:   '⏰ Automatic reset',
    recapResetValue:   'Every day at **{time}** (Europe/Paris)',
    recapFooter:       '⚠️ This action will replace the existing configuration.',
    recapConfirm:      '✅ Confirm',
    recapCancel:       '❌ Cancel',

    // Confirmation
    confirmTitle:       '✅ Configuration saved!',
    confirmDescription: 'Teams have been configured successfully.\n\n👉 Now run `/setup-teams` in the channel of your choice to display the selection panel.',
    confirmRoleField:   'Role: <@&{roleId}>\nMax: **{max}** players',
    confirmResetField:  '⏰ Automatic reset',
    confirmResetValue:  'Every day at **{time}** (Europe/Paris)',
    confirmFooter:      'TeamForge',
    logSuccess:         'Configuration saved by {user} — {count} team(s) — reset at {time}',

    // Annulation
    cancelTitle:       '❌ Setup cancelled',
    cancelDescription: 'The configuration has not been modified.',

    // Config existante
    existingRoleField: 'Role: <@&{roleId}>\nMax: {max} players',
  },
};
