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
2. Cliquer sur **"New Application"**
3. Donner un nom : `TeamForge`
4. Cliquer sur **"Create"**

### 1.2 Configurer le bot

1. Menu gauche → **"Bot"**
2. Cliquer sur **"Reset Token"** → copier le token *(affiché une seule fois !)*
3. Activer les **Privileged Gateway Intents** :
   - ✅ `Server Members Intent`
   - ✅ `Message Content Intent`

### 1.3 Récupérer les IDs

**CLIENT_ID** :
```
Menu gauche → "OAuth2" → copier "Client ID"
```

**GUILD_ID** :
```
Discord → Paramètres → Avancé → activer "Mode développeur"
Clic droit sur ton serveur → "Copier l'identifiant"
```

### 1.4 Inviter le bot sur le serveur

1. Menu gauche → **"OAuth2"** → **"URL Generator"**
2. Cocher les scopes :
   - ✅ `bot`
   - ✅ `applications.commands`
3. Cocher les permissions bot :
   - ✅ `Manage Roles`
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Read Message History`
   - ✅ `View Channels`
4. Copier l'URL générée → ouvrir dans le navigateur → choisir le serveur → **Autoriser**

---

## 2️⃣ Installation sur la VM Debian

### 2.1 Installer Docker

```bash
# Mettre à jour les paquets
sudo apt update && sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y ca-certificates curl gnupg

# Ajouter la clé GPG Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Ajouter l'utilisateur au groupe docker (évite sudo)
sudo usermod -aG docker $USER
newgrp docker

# Vérifier l'installation
docker --version
docker compose version
```

### 2.2 Cloner le projet

```bash
# Cloner le repo
git clone https://github.com/TON_USERNAME/teamforge-bot.git

# Entrer dans le dossier
cd teamforge-bot
```

### 2.3 Créer le fichier `.env`

```bash
nano .env
```

Contenu :
```env
DISCORD_TOKEN=ton_token_discord
CLIENT_ID=ton_client_id
GUILD_ID=ton_guild_id
```

Sauvegarder : `Ctrl+X` → `Y` → `Entrée`

---

## 3️⃣ Déploiement

### Option A — Ligne de commande *(recommandé)*

```bash
# Builder et démarrer le container
docker compose up -d --build

# Vérifier que le container tourne
docker ps

# Vérifier les logs
docker logs -f teamforge
```

### Option B — Via Portainer

#### Installer Portainer

```bash
docker volume create portainer_data

docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Accéder à Portainer : `https://IP_DE_TA_VM:9443`

#### Créer la Stack TeamForge

```
Portainer → Stacks → + Add Stack
```

| Champ | Valeur |
|---|---|
| Name | `teamforge` |
| Build method | `Repository` |
| Repository URL | `https://github.com/TON_USERNAME/teamforge-bot` |
| Branch | `main` |
| Compose path | `docker-compose.yml` |

Ajouter les variables d'environnement :

| Variable | Valeur |
|---|---|
| `DISCORD_TOKEN` | ton token |
| `CLIENT_ID` | ton client ID |
| `GUILD_ID` | ton guild ID |

Cliquer **"Deploy the stack"**

---

## 4️⃣ Déploiement des Slash Commands

```bash
docker exec -it teamforge node scripts/deploy-commands.js
```

✅ Ce que tu dois voir :
```
[...] 🔧 COMMAND | Commande préparée : /ping
[...] 🔧 COMMAND | Commande préparée : /reset-teams
[...] 🔧 COMMAND | Commande préparée : /set-reset-time
[...] 🔧 COMMAND | Commande préparée : /setup-teams
[...] 🔧 COMMAND | Commande préparée : /setup-wizard
[...] 🔧 COMMAND | Commande préparée : /teams-status
[...] ✅ SUCCESS | 6 commande(s) déployée(s) avec succès !
```

> ⚠️ Cette commande est à relancer uniquement quand tu ajoutes ou modifies des slash commands.

---

## 5️⃣ Configuration Discord

### 5.1 Créer les rôles Team

```
Paramètres du serveur → Rôles → Créer un rôle
```

Créer autant de rôles que d'équipes souhaitées (ex: `Team 1`, `Team 2`...).

### 5.2 Hiérarchie des rôles

```
Paramètres du serveur → Rôles
```

Glisser le rôle **TeamForge** au-dessus de tous les rôles Team :

```
@admin
@TeamForge        ← doit être ici
@Team 1
@Team 2
@Team 3
@everyone
```

---

## 6️⃣ Premier lancement

### 6.1 Lancer le Setup Wizard

Dans Discord (en tant qu'admin) :
```
/setup-wizard
```

Suivre les 4 étapes :
1. **Nombre d'équipes** — saisir entre 1 et 12
2. **Config de chaque équipe** — nom, emoji, max joueurs
3. **Rôles Discord** — sélectionner le rôle pour chaque équipe
4. **Heure de reset** — format HH:MM (ex: `03:00`)

### 6.2 Envoyer le panneau

Dans le salon de ton choix :
```
/setup-teams
```

Remplir le modal :
- **Titre** — titre de l'embed (modifiable)
- **Description** — texte d'explication (modifiable)
- **Rôle à mentionner** — nom du rôle (optionnel, ex: `@everyone`)

---

## 7️⃣ Vérification finale

✅ Check-list :

```
□ Le bot est en ligne sur Discord (statut vert)
□ /ping répond avec l'embed de latence
□ /setup-wizard fonctionne en 4 étapes
□ /setup-teams envoie le panneau avec les boutons
□ Cliquer sur un bouton attribue le rôle
□ L'embed se met à jour après un clic
□ Le bouton 🚪 retire le rôle
□ Les logs ne montrent aucune erreur
□ Le cron de reset est démarré dans les logs
```

---

## 🔄 Workflow de mise à jour

Pour chaque modification du code :

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

Causes fréquentes :
- Variable d'environnement manquante dans `.env`
- Chemin d'import incorrect dans un fichier JS
- Erreur de syntaxe dans un fichier

### Rate limit Discord

Symptôme : `Request with opcode 8 was rate limited`

Cause : `guild.members.fetch()` appelé trop fréquemment.
Solution : vérifier que le fetch n'est appelé qu'une fois au démarrage du panneau.

### "Missing Access"

Cause : Le bot n'a pas les permissions sur le salon.
Solution : vérifier les permissions du rôle TeamForge sur le salon concerné.

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

---

## 📦 Sauvegarde des données

Les données importantes sont dans le volume Docker `teamforge_data` :

```bash
# Localiser le volume
docker volume inspect teamforge_data

# Sauvegarder config.json
docker cp teamforge:/app/data/config.json ./config_backup.json
```
