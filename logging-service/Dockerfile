# Usa Node.js 18 con Alpine Linux per un'immagine leggera
FROM node:18-alpine

# Stabilisce la directory di lavoro all'interno del container
WORKDIR /app

# Copia i file package.json e package-lock.json
# Questi vengono copiati prima del resto del codice per sfruttare il caching di Docker
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file dell'applicazione
COPY . .

# Crea la directory per i log se non esiste
RUN mkdir -p /app/logs

# Espone la porta su cui il servizio sarà in ascolto
EXPOSE 8080

# Comando per avviare l'applicazione
CMD ["node", "server.js"]
