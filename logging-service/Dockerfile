# Usa Node.js 18 con Alpine Linux per un'immagine leggera
FROM node:18-alpine

# Installa il client Docker
RUN apk add --no-cache docker-cli

# Stabilisce la directory di lavoro all'interno del container
WORKDIR /app

# Copia i file package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file dell'applicazione
COPY . .

# Crea le directory se non esistono
RUN mkdir -p /app/logs /app/ui/css /app/ui/js

# Espone la porta su cui il servizio sarà in ascolto
EXPOSE 8080

# Comando per avviare l'applicazione
CMD ["node", "server.js"]