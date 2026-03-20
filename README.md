# ⚔️ TeamForge — Discord Team Management Bot

> Bot Discord de gestion d'équipes dynamiques avec attribution automatique des rôles, panneau interactif, reset quotidien et support multilingue.

---

## 📋 Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Structure du projet](#-structure-du-projet)
- [Commandes](#-commandes)
- [Configuration](#-configuration)
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
- 🔄 **Gestion automatique des rôles** — Attribution/retrait automatique lors du clic
- 👥 **Limite de joueurs** — Refus automatique si une équipe est complète
- 🚪 **Quitter une équipe** — Bouton dédié pour se retirer
- ⏰ **Reset automatique** — Suppression des rôles tous les jours à l'heure configurée
- 🔁 **Mise à jour en temps réel** — L'embed se met à jour à chaque changement
- 🌐 **Multilingue** — Support EN/FR via `/set-language`, extensible à d'autres langues
- 💾 **Persistance** — Configuration sauvegardée dans `data/config.json` (volume Docker)
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
│   │   └── teamHandler.js        # Logique de sélection d'équipe
│   ├── locales/
│   │   ├── en.js                 # Traductions anglaises
│   │   └── fr.js                 # Traductions françaises
│   ├── services/
│   │   ├── configService.js      # Lecture/écriture de data/config.json
│   │   ├── wizardService.js      # Sessions wizard en mémoire
│   │   └── cronService.js        # Gestion du cron de reset
│   └── utils/
│       ├── logger.js             # Logger centralisé avec timestamps
│       ├── i18n.js               # Système de traduction t('key', vars)
│       └── teamEmbed.js          # Construction des embeds et boutons
├── scripts/
│   └── deploy-commands.js        # Déploiement des slash commands
├── data/                         # Volume Docker — données persistantes
│   └── config.json               # Configuration des équipes (auto-généré)
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
| `/set-reset-time` | Modifie l'heure du reset automatique sans refaire le wizard |
| `/set-language` | Change la langue du bot (`en` / `fr`) |
| `/reset-teams` | Retire manuellement tous les rôles Team de tous les membres |
| `/teams-status` | Force le rafraîchissement du panneau |

### Boutons membres

| Bouton | Description |
|---|---|
| `[Emoji] Nom de l'équipe` | Rejoindre une équipe |
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

Généré automatiquement par le `/setup-wizard` :

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
  "resetTime": "03:00",
  "language": "en",
  "setupMessageId": "123456789012345678",
  "setupChannelId": "123456789012345678"
}
```

| Champ | Description |
|---|---|
| `teams` | Liste des équipes configurées |
| `teams[].id` | Identifiant unique de l'équipe |
| `teams[].name` | Nom de l'équipe |
| `teams[].emoji` | Emoji affiché sur le bouton |
| `teams[].maxPlayers` | Nombre maximum de joueurs (1–99) |
| `teams[].roleId` | ID du rôle Discord associé |
| `resetTime` | Heure du reset quotidien (HH:MM, fuseau Europe/Paris) |
| `language` | Langue active (`en` ou `fr`, défaut : `en`) |
| `setupMessageId` | ID du message du panneau actif |
| `setupChannelId` | ID du salon du panneau actif |

---

## 🌐 Internationalisation

TeamForge supporte plusieurs langues via un système i18n intégré.

### Langues disponibles

| Code | Langue | Commande |
|---|---|---|
| `en` | 🇬🇧 English | `/set-language language:English` |
| `fr` | 🇫🇷 Français | `/set-language language:Français` |

### Fonctionnement

La langue est sauvegardée dans `data/config.json` et persiste après redémarrage. Tous les messages du bot (embeds, boutons, réponses éphémères, modals) sont traduits automatiquement.

### Ajouter une nouvelle langue

1. Créer `src/locales/de.js` (ou autre code langue) en copiant `en.js`
2. Traduire toutes les valeurs
3. Ajouter la langue dans `src/utils/i18n.js` :
```js
const locales = {
  en: require('../locales/en'),
  fr: require('../locales/fr'),
  de: require('../locales/de'), // ← ajouter ici
};
```
4. Ajouter le choix dans `src/commands/set-language.js` :
```js
.addChoices(
  { name: '🇬🇧 English',  value: 'en' },
  { name: '🇫🇷 Français', value: 'fr' },
  { name: '🇩🇪 Deutsch',  value: 'de' }, // ← ajouter ici
)
```

### Utilisation dans le code

```js
const { t } = require('../utils/i18n');

// Clé simple
t('ping.title')  // → "🏓 Pong!" (EN) ou "🏓 Pong !" (FR)

// Clé avec variables
t('teamHandler.joinSuccess', { emoji: '🔴', name: 'Team 1' })
// → "✅ You joined **🔴 Team 1**!"
```

---

## 🔄 Flux d'utilisation

### Premier démarrage

```
1. /setup-wizard      → Configurer les équipes + heure de reset
2. /set-language      → Choisir la langue (optionnel, défaut EN)
3. /setup-teams       → Envoyer le panneau dans un salon
4. Les membres cliquent sur les boutons pour rejoindre une équipe
```

### Modifier uniquement l'heure de reset

```
/set-reset-time  → Saisir la nouvelle heure HH:MM
```

### Changer la langue

```
/set-language → Choisir EN ou FR
```

### Reconfigurer les équipes

```
/setup-wizard  → Détecte la config existante → demande confirmation
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
  ├── isChatInputCommand()      →  commandHandler  →  commands/*.js
  │
  ├── customId: "wizard_*"      →  wizardHandler.js
  │     ├── Boutons (count, edit_team, confirm, cancel...)
  │     ├── Modals (count, team config, reset time)
  │     └── RoleSelectMenu (rôle par équipe)
  │
  ├── customId: "team_*"        →  teamHandler.js
  │     ├── team_1, team_2...   →  handleJoin()
  │     └── team_leave          →  handleLeave()
  │
  ├── customId: "setup_teams_modal"    →  envoi du panneau
  └── customId: "set_reset_time_modal" →  mise à jour du cron
```

### Système i18n

```
t('section.key', { var: value })
  │
  ▼
i18n.js
  ├── getLang()          → lit config.language (défaut: 'en')
  ├── locales[lang][key] → retourne la string traduite
  ├── fallback EN        → si clé absente dans la langue active
  └── replace {vars}     → injection des variables
```

### Gestion du cache membres

Pour éviter les rate limits Discord :
- `guild.members.fetch()` appelé **une seule fois** si `cache.size <= 1`
- Les refreshs suivants utilisent **uniquement le cache**

### Disposition des boutons

L'algorithme répartit automatiquement les boutons sur plusieurs lignes :

| Nombre d'équipes | Disposition |
|---|---|
| 1–5 | 1 ligne |
| 6–8 | 2 lignes de 3–4 |
| 9–12 | 3 lignes de 3–4 |

Maximum Discord : 5 boutons × 4 lignes (la 5ème est réservée au bouton Quitter) = 20 équipes max.

---

## 💾 Données persistantes

Les données sont stockées dans `data/config.json`, monté comme **volume Docker** :

```yaml
volumes:
  - teamforge_data:/app/data
```

✅ Les données survivent aux redémarrages et rebuilds du container.

```bash
# Sauvegarder la config
docker cp teamforge:/app/data/config.json ./config_backup.json

# Restaurer la config
docker cp ./config_backup.json teamforge:/app/data/config.json
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
# Voir les logs en temps réel
docker logs -f teamforge
```

---

## 🔐 Permissions Discord requises

| Permission | Raison |
|---|---|
| `Manage Roles` | Attribuer/retirer les rôles Team |
| `Send Messages` | Envoyer les embeds |
| `Embed Links` | Afficher les embeds |
| `Read Message History` | Retrouver le message au redémarrage |
| `View Channels` | Voir les salons |

> ⚠️ Le rôle **TeamForge** doit être placé **au-dessus** des rôles Team dans la hiérarchie du serveur.
