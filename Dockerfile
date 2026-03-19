# Image légère Node.js Alpine
FROM node:20-alpine

# Métadonnées
LABEL maintainer="TeamForge"
LABEL description="Discord bot for team management"

# Dossier de travail dans le container
WORKDIR /app

# Copier package.json en premier (optimisation cache Docker)
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --omit=dev

# Copier tout le reste du projet
COPY . .

# Créer le dossier data (persistance JSON)
RUN mkdir -p /app/data

# Démarrer le bot
CMD ["node", "index.js"]