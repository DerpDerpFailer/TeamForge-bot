# ⚔️ TeamForge — Discord Team Management Bot

> Bot Discord de gestion d'équipes dynamiques avec attribution automatique des rôles, panneau interactif, sous-rôles, reset quotidien et support multilingue.

---

## 📋 Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Commandes](#-commandes)
- [Configuration](#-configuration)
- [Sous-rôles](#-sous-rôles)
- [Internationalisation](#-internationalisation)
- [Flux d'utilisation](#-flux-dutilisation)
- [Architecture](#-architecture)
- [Données persistantes](#-données-persistantes)
- [Logs](#-logs)
- [Permissions Discord](#-permissions-discord-requises)

---

## ✨ Fonctionnalités

- 🧙 **Setup Wizard** — Configuration guidée des équipes (nom, emoji, max joueurs, rôle Discord, heure de reset)
- 📋 **Panneau interactif** — Embed dynamique avec boutons de sélection d'équipe
- ⚔️ **Sous-rôles** — Sélection d'un sous-rôle (Tank, Healer, DPS...) après avoir rejoint une équipe, affiché dans l'embed
- 🔄 **Gestion automatique des rôles** — Attribution/retrait automatique lors du clic
- 👥 **Limite de joueurs** — Refus automatique si une équipe est complète
- 🚪 **Quitter une équipe** — Bouton dédié pour se retirer
- ⏰ **Reset automatique** — Suppression des rôles tous les jours à l'heure configurée
- 🔁 **Mise à jour en temps réel** — L'embed se met à jour à chaque changement
- 💬 **Messages éphémères auto-supprimés** — Les confirmations disparaissent automatiquement après 3 secondes
- 🌐 **Multilingue** — Support EN/FR via `/set-language`, extensible à d'autres langues
- 💾 **Persistance** — Configuration et sous-rôles membres sauvegardés (volume Docker)
- 🐳 **Docker ready** — Image légère Alpine, déploiement simple via `docker compose`

---

## 🛠️ Stack technique

| Technologie | Version | Usage |
|---|---|---|
| Node.js | 20 (Alpine) | Runtime |
| discord.js | ^14.16.3 | Librairie Discord |
| node-cron | ^3.0.3 | Reset automatique |
| dotenv | ^16.4.5 | Variables d'environnement |
| Docker | — | Conteneurisation |

---

## 📁 Structure du projet

```
teamforge-bot/
├── src/
│   ├── commands/
│   │   ├── ping.js               # Test de connectivité
│   │   ├── setup-wizard.js       # Configuration guidée des équipes
│   │   ├── setup-teams.js        # Envoi du panneau de sélection
│   │   ├── set-roles.js          # Configuration des sous-rôles
│   │   ├── set-reset-time.js     # Modification de l'heure de reset
│   │   ├── set-language.js       # Changement de langue du bot
│   │   ├── reset-teams.js        # Reset manuel des équipes
│   │   └── teams-status.js       # Rafraîchissement forcé du panneau
│   ├── events/
│   │   ├── ready.js              # Événement de connexion
│   │   └── interactionCreate.js  # Router de toutes les interactions
│   ├── handlers/
│   │   ├── commandHandler.js     # Chargement automatique des commandes
│   │   ├── eventHandler.js       # Chargement automatique des événements
│   │   ├── wizardHandler.js      # Logique du setup wizard
│   │   ├── teamHandler.js        # Logique de sélection d'équipe
│   │   ├── setRolesHandler.js    # Logique du wizard /set-roles
│   │   └── subRoleHandler.js     # Logique de sélection de sous-rôle
│   ├── locales/
│   │   ├── en.js                 # Traductions anglaises
│   │   └── fr.js                 # Traductions françaises
│   ├── services/
│   │   ├── configService.js      # Lecture/écriture config.json + memberRoles.json
│   │   ├── wizardService.js      # Sessions wizard en mémoire
│   │   └── cronService.js        # Gestion du cron de reset
│   └── utils/
│       ├── logger.js             # Logger centralisé avec timestamps
│       ├── i18n.js               # Système de traduction t('key', vars)
│       └── teamEmbed.js          # Construction des embeds et boutons
├── scripts/
│   └── deploy-commands.js        # Déploiement des slash commands
├── data/                         # Volume Docker — données persistantes
│   ├── config.json               # Configuration des équipes (auto-généré)
│   └── memberRoles.json          # Sous-rôles choisis par les membres (auto-généré)
├── .env                          # Variables d'environnement (ne pas commit)
├── .env.example                  # Template des variables
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── index.js                      # Point d'entrée
└── package.json
```

---

## 🤖 Commandes

### Commandes admin

| Commande | Description |
|---|---|
| `/setup-wizard` | Lance le wizard de configuration des équipes |
| `/setup-teams` | Envoie le panneau de sélection dans le salon courant |
| `/set-roles` | Configure les sous-rôles (Tank, Healer, DPS...) |
| `/set-reset-time` | Modifie l'heure du reset automatique sans refaire le wizard |
| `/set-language` | Change la langue du bot (`en` / `fr`) |
| `/reset-teams` | Retire manuellement tous les rôles Team de tous les membres |
| `/teams-status` | Force le rafraîchissement du panneau |

### Boutons membres

| Bouton | Description |
|---|---|
| `[Emoji] Nom de l'équipe` | Rejoindre une équipe → affiche la sélection de sous-rôle |
| `[Emoji] Nom du sous-rôle` | Choisir son sous-rôle (affiché dans l'embed) |
| `🚪 Leave my team / Quitter mon équipe` | Se retirer de son équipe |

### Commandes utilitaires

| Commande | Description |
|---|---|
| `/ping` | Vérifie que le bot est opérationnel (latence bot + API) |

---

## ⚙️ Configuration

### Variables d'environnement (`.env`)

```env
DISCORD_TOKEN=ton_token_discord
CLIENT_ID=ton_client_id
GUILD_ID=ton_guild_id
```

### Structure de `data/config.json`

```json
{
  "teams": [
    {
      "id": 1,
      "name": "Team 1",
      "emoji": "🔴",
      "maxPlayers": 6,
      "roleId": "123456789012345678"
    }
  ],
  "subRoles": [
    {
      "id": 1,
      "name": "Tank",
      "emoji": "🛡️",
      "roleId": "123456789012345678"
    }
  ],
  "resetTime": "03:00",
  "language": "en",
  "setupMessageId": "123456789012345678",
  "setupChannelId": "123456789012345678"
}
```

| Champ | Description |
|---|---|
| `teams` | Liste des équipes configurées |
| `subRoles` | Liste des sous-rôles disponibles |
| `subRoles[].roleId` | Rôle Discord associé (optionnel) |
| `resetTime` | Heure du reset quotidien (HH:MM, fuseau Europe/Paris) |
| `language` | Langue active (`en` ou `fr`, défaut : `en`) |
| `setupMessageId` | ID du message du panneau actif |
| `setupChannelId` | ID du salon du panneau actif |

---

## ⚔️ Sous-rôles

Les sous-rôles permettent à chaque membre de choisir sa spécialité au sein de son équipe (ex : Tank, Healer, DPS Ranged, DPS Melee). Le sous-rôle choisi est affiché sous forme d'emoji devant le pseudo du membre dans l'embed.

### Fonctionnement

```
Membre clique sur [🔴 Team 1]
  → Rejoint l'équipe
  → Message éphémère : [🛡️ Tank] [💚 Healer] [🏹 DPS Ranged] [⚔️ DPS Melee]

Membre clique sur [🛡️ Tank]
  → "✅ You chose 🛡️ Tank!"  ← auto-supprimé après 3s
  → L'embed se met à jour :
      🔴 Team 1 (1/6)
      🛡️ @Membre
```

### Comportements

| Situation | Comportement |
|---|---|
| Membre clique à nouveau sur sa team | Réaffiche la sélection de sous-rôle |
| Membre change de team | Sous-rôle réinitialisé, doit rechoisir |
| Membre quitte l'équipe | Sous-rôle supprimé |
| Reset automatique | Tous les sous-rôles effacés |
| `/reset-teams` | Tous les sous-rôles effacés |

### Configuration via `/set-roles`

Wizard en 3 étapes :
1. Nombre de sous-rôles (1 à 5)
2. Nom + emoji de chaque sous-rôle
3. Rôle Discord associé (optionnel)

---

## 🌐 Internationalisation

| Code | Langue | Commande |
|---|---|---|
| `en` | 🇬🇧 English | `/set-language language:English` |
| `fr` | 🇫🇷 Français | `/set-language language:Français` |

### Ajouter une nouvelle langue

1. Créer `src/locales/de.js` en copiant `en.js` et traduire toutes les valeurs
2. Ajouter dans `src/utils/i18n.js` :
```js
const locales = { en, fr, de: require('../locales/de') };
```
3. Ajouter le choix dans `src/commands/set-language.js` :
```js
{ name: '🇩🇪 Deutsch', value: 'de' }
```

---

## 🔄 Flux d'utilisation

### Premier démarrage

```
1. /setup-wizard   → Configurer les équipes + heure de reset
2. /set-roles      → Configurer les sous-rôles (optionnel)
3. /set-language   → Choisir la langue (optionnel, défaut EN)
4. /setup-teams    → Envoyer le panneau dans un salon
```

### Modifier uniquement l'heure de reset
```
/set-reset-time → Saisir la nouvelle heure HH:MM
```

### Reconfigurer les sous-rôles
```
/set-roles → Détecte la config existante → demande confirmation
```

---

## 🏗️ Architecture

### Flux des interactions Discord

```
Discord
  │
  ▼
interactionCreate.js  (router)
  │
  ├── isChatInputCommand()       → commandHandler → commands/*.js
  │
  ├── customId: "wizard_*"       → wizardHandler.js
  │
  ├── customId: "setroles_*"     → setRolesHandler.js
  │
  ├── customId: "team_*"         → teamHandler.js
  │     ├── team_1, team_2...    → handleJoin() → buildSubRolePayload()
  │     └── team_leave           → handleLeave()
  │
  ├── customId: "subrole_*"      → subRoleHandler.js
  │     └── subrole_1, 2...      → handle() → setMemberSubRole() → deleteReply() après 3s
  │
  ├── setup_teams_modal          → envoi du panneau
  └── set_reset_time_modal       → mise à jour du cron
```

### Messages éphémères auto-supprimés

```
deferReply({ Ephemeral })   ← rend le message supprimable
editReply(content)          ← affiche la confirmation
setTimeout(3000)
  → deleteReply()           ← suppression automatique
```

### Gestion des sous-rôles membres

```
memberRoles.json : { "userId": subRoleId }
  │
  ├── setMemberSubRole(userId, subRoleId)   ← choix d'un sous-rôle
  ├── clearMemberSubRole(userId)            ← quitte la team
  ├── clearAllMemberSubRoles()              ← reset quotidien
  └── getMemberSubRoleEmoji(userId, list)   ← emoji dans l'embed
```

---

## 💾 Données persistantes

| Fichier | Contenu | Effacé au reset |
|---|---|---|
| `data/config.json` | Équipes, sous-rôles, heure reset, langue | ❌ Non |
| `data/memberRoles.json` | Sous-rôle choisi par chaque membre | ✅ Oui |

```bash
# Sauvegarder
docker cp teamforge:/app/data/config.json ./config_backup.json
docker cp teamforge:/app/data/memberRoles.json ./memberRoles_backup.json

# Restaurer
docker cp ./config_backup.json teamforge:/app/data/config.json
docker cp ./memberRoles_backup.json teamforge:/app/data/memberRoles.json
docker restart teamforge
```

---

## 📝 Logs

Format : `[YYYY-MM-DD HH:MM:SS] LEVEL | Message`

| Niveau | Icône | Usage |
|---|---|---|
| INFO | ℹ️ | Informations générales |
| SUCCESS | ✅ | Opérations réussies |
| WARN | ⚠️ | Avertissements non bloquants |
| ERROR | ❌ | Erreurs |
| COMMAND | 🔧 | Exécution de commandes |
| EVENT | 📡 | Événements Discord |

```bash
docker logs -f teamforge
```

---

## 🔐 Permissions Discord requises

| Permission | Raison |
|---|---|
| `Manage Roles` | Attribuer/retirer les rôles Team et sous-rôles |
| `Send Messages` | Envoyer les embeds |
| `Embed Links` | Afficher les embeds |
| `Read Message History` | Retrouver le message au redémarrage |
| `View Channels` | Voir les salons |

> ⚠️ Le rôle **TeamForge** doit être placé **au-dessus** des rôles Team ET des rôles sous-rôles dans la hiérarchie du serveur.
