# 🚀 TeamForge — Guide d'installation

---

## 📋 Prérequis

| Prérequis | Version minimale |
|---|---|
| Debian | 11+ |
| Docker | 24+ |
| Docker Compose | v2+ |
| Git | 2+ |
| Portainer *(optionnel)* | 2+ |

---

## 1️⃣ Création du bot Discord

### 1.1 Créer l'application

1. Aller sur [discord.com/developers/applications](https://discord.com/developers/applications)
2. Cliquer sur **"New Application"** → nommer `TeamForge` → **"Create"**

### 1.2 Configurer le bot

1. Menu gauche → **"Bot"**
2. **"Reset Token"** → copier le token *(affiché une seule fois !)*
3. Activer les **Privileged Gateway Intents** :
   - ✅ `Server Members Intent`
   - ✅ `Message Content Intent`

### 1.3 Récupérer les IDs

**CLIENT_ID** : Menu gauche → **"OAuth2"** → copier "Client ID"

**GUILD_ID** : Discord → Paramètres → Avancé → activer **"Mode développeur"** → clic droit sur le serveur → **"Copier l'identifiant"**

### 1.4 Inviter le bot

1. Menu gauche → **"OAuth2"** → **"URL Generator"**
2. Scopes : ✅ `bot` ✅ `applications.commands`
3. Permissions :
   - ✅ `Manage Roles`
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Read Message History`
   - ✅ `View Channels`
4. Copier l'URL → ouvrir → choisir le serveur → **Autoriser**

---

## 2️⃣ Installation sur la VM Debian

### 2.1 Installer Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
docker --version && docker compose version
```

### 2.2 Cloner le projet

```bash
git clone https://github.com/TON_USERNAME/teamforge-bot.git
cd teamforge-bot
```

### 2.3 Créer le fichier `.env`

```bash
nano .env
```

```env
DISCORD_TOKEN=ton_token_discord
CLIENT_ID=ton_client_id
GUILD_ID=ton_guild_id
```

`Ctrl+X` → `Y` → `Entrée`

---

## 3️⃣ Déploiement

### Option A — Ligne de commande

```bash
docker compose up -d --build
docker ps
docker logs -f teamforge
```

### Option B — Via Portainer

#### Installer Portainer

```bash
docker volume create portainer_data
docker run -d \
  -p 8000:8000 -p 9443:9443 \
  --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Accéder à : `https://IP_DE_TA_VM:9443`

#### Créer la Stack

```
Portainer → Stacks → + Add Stack
Name: teamforge
Build method: Repository
URL: https://github.com/TON_USERNAME/teamforge-bot
Branch: main
Compose path: docker-compose.yml
```

Variables d'environnement :

| Variable | Valeur |
|---|---|
| `DISCORD_TOKEN` | ton token |
| `CLIENT_ID` | ton client ID |
| `GUILD_ID` | ton guild ID |

→ **"Deploy the stack"**

---

## 4️⃣ Déploiement des Slash Commands

```bash
docker exec -it teamforge node scripts/deploy-commands.js
```

✅ Ce que tu dois voir :
```
[...] 🔧 COMMAND | Commande préparée : /ping
[...] 🔧 COMMAND | Commande préparée : /reset-teams
[...] 🔧 COMMAND | Commande préparée : /set-language
[...] 🔧 COMMAND | Commande préparée : /set-reset-time
[...] 🔧 COMMAND | Commande préparée : /set-roles
[...] 🔧 COMMAND | Commande préparée : /setup-teams
[...] 🔧 COMMAND | Commande préparée : /setup-wizard
[...] 🔧 COMMAND | Commande préparée : /teams-status
[...] ✅ SUCCESS | 8 commande(s) déployée(s) avec succès !
```

---

## 5️⃣ Configuration Discord

### 5.1 Créer les rôles Team

```
Paramètres du serveur → Rôles → Créer un rôle
```

Créer autant de rôles que d'équipes souhaitées (ex: `Team 1`, `Team 2`...).

### 5.2 Créer les rôles sous-rôles *(optionnel)*

Si tu veux des rôles Discord associés aux sous-rôles :
```
Paramètres du serveur → Rôles → Créer un rôle
```
Exemples : `Tank`, `Healer`, `DPS Ranged`, `DPS Melee`

### 5.3 Hiérarchie des rôles

Le rôle **TeamForge** doit être au-dessus de **tous** les rôles Team et sous-rôles :

```
@admin
@TeamForge        ← doit être ici
@Team 1
@Team 2
@Tank
@Healer
@everyone
```

---

## 6️⃣ Premier lancement

### 6.1 Choisir la langue *(optionnel)*

```
/set-language → Français
→ "✅ Langue définie sur Français 🇫🇷"
```

### 6.2 Lancer le Setup Wizard

```
/setup-wizard
```

4 étapes :
1. Nombre d'équipes (1 à 12)
2. Config de chaque équipe (nom, emoji, max joueurs)
3. Rôles Discord pour chaque équipe
4. Heure de reset (HH:MM)

### 6.3 Configurer les sous-rôles *(optionnel)*

```
/set-roles
```

3 étapes :
1. Nombre de sous-rôles (1 à 5)
2. Nom + emoji de chaque sous-rôle
3. Rôle Discord associé (optionnel)

### 6.4 Envoyer le panneau

```
/setup-teams
```

Modal :
- **Titre** — titre de l'embed
- **Description** — texte d'explication
- **Rôle à mentionner** — nom du rôle (optionnel)

---

## 7️⃣ Vérification finale

```
□ Le bot est en ligne (statut vert)
□ /ping répond avec l'embed de latence
□ /set-language fonctionne (EN ↔ FR)
□ /setup-wizard fonctionne en 4 étapes
□ /set-roles configure les sous-rôles
□ /setup-teams envoie le panneau avec les boutons
□ Cliquer sur un bouton de team → sélection sous-rôle apparaît
□ Choisir un sous-rôle → emoji affiché dans l'embed
□ Le message éphémère se supprime automatiquement après 3s
□ Le bouton 🚪 retire le rôle + efface le sous-rôle
□ /set-reset-time configure le cron
□ Le cron repart automatiquement au redémarrage
□ Les logs ne montrent aucune erreur ni warning
```

---

## 8️⃣ Workflow de mise à jour

```bash
# Sur ta machine locale
git add fichier_modifié.js
git commit -m "feat/fix: description"
git push

# Sur la VM
cd ~/teamforge-bot
git pull
docker compose up -d --build

# Si nouvelles slash commands ajoutées
docker exec -it teamforge node scripts/deploy-commands.js
```

---

## 🐛 Dépannage

### Le container redémarre en boucle
```bash
docker logs teamforge --tail 30
```
Causes : variable d'environnement manquante, chemin d'import incorrect, erreur de syntaxe JS.

### Rate limit Discord
Symptôme : `Request with opcode 8 was rate limited`
Solution : le cache est utilisé automatiquement si `guild.members.cache.size > 1`.

### "Missing Access"
Cause : permissions manquantes sur le salon.
Solution : vérifier les permissions du rôle TeamForge sur le salon.

### Les slash commands n'apparaissent pas
```bash
docker exec -it teamforge node scripts/deploy-commands.js
```
Attendre 1–2 minutes que Discord propage les commandes.

### Timeout de build dans Portainer
```bash
cd ~/teamforge-bot
git pull
docker compose down
docker compose up -d --build
```

### La langue ne change pas
```bash
docker exec -it teamforge cat data/config.json
```

### Les sous-rôles n'apparaissent pas dans l'embed
```bash
docker exec -it teamforge cat data/memberRoles.json
```
Vérifier que `subRoles` est bien configuré dans `config.json`.

---

## 📦 Sauvegarde des données

```bash
# Sauvegarder
docker cp teamforge:/app/data/config.json ./config_backup.json
docker cp teamforge:/app/data/memberRoles.json ./memberRoles_backup.json

# Restaurer
docker cp ./config_backup.json teamforge:/app/data/config.json
docker cp ./memberRoles_backup.json teamforge:/app/data/memberRoles.json
docker restart teamforge
```
