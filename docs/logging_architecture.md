# Architettura del Microservizio di Logging Semplificato per HRease

## Introduzione

Questo documento descrive l'architettura semplificata del microservizio di logging implementato in HRease. Il sistema è stato progettato come un servizio indipendente ma leggero per fornire una soluzione centralizzata per la gestione dei log di tutti i componenti della piattaforma, senza aggiungere complessità eccessiva al processo di sviluppo.

## Visione d'insieme

Il microservizio di logging semplificato ha lo scopo di:

1. Raccogliere log da tutti i componenti dell'ecosistema HRease (backend, frontend, container Docker)
2. Centralizzare l'archiviazione dei log in un formato standardizzato e facilmente consultabile
3. Offrire strumenti base per la visualizzazione e ricerca dei log
4. Facilitare il debugging e la risoluzione dei problemi
5. Fornire un'interfaccia web semplice per la consultazione

Questo approccio pragmatico permette di implementare rapidamente un sistema funzionale che potrà essere esteso in futuro se necessario.

## Architettura del Microservizio

![Architettura Logging Semplificata](../diagrams/logging_simple_architecture.png)

*Nota: Si dovrà creare questo diagramma semplificato.*

### Componenti principali

#### 1. Server Node.js con Express
- Un server web leggero che espone API RESTful e serve l'interfaccia utente
- Gestisce la ricezione, lo storage e la consultazione dei log
- Implementa la raccolta dei log dai container Docker

#### 2. Storage basato su file JSON
- Archiviazione semplice dei log in file JSON organizzati per sorgente
- Supporto per rotazione dei file per gestire la crescita dei log
- Senza dipendenze da database esterni

#### 3. API REST minimalista
- Endpoint `/api/logs` per ricevere log da varie sorgenti
- Endpoint `/api/logs/:source` per consultare i log per sorgente
- Supporto per filtri base (livello, ricerca testuale, paginazione)

#### 4. Collettori di log
- Collettore HTTP per ricevere log da backend e frontend
- Collettore Docker per raccogliere log dai container
- Possibilità di aggiungere collettori personalizzati in futuro

#### 5. UI Web semplice
- Dashboard HTML/CSS/JS con Bootstrap
- Visualizzazione dei log con supporto per filtri
- Aggiornamento automatico e ricerca base

## Flusso dei dati

1. **Generazione del log**:
   - I client (backend, frontend) generano eventi di log
   - I container Docker producono output nei loro stdout/stderr

2. **Ingestione**:
   - Backend e frontend inviano i log tramite chiamate HTTP al microservizio
   - I log dei container vengono raccolti periodicamente usando l'API Docker

3. **Processamento**:
   - I log vengono validati e normalizzati in un formato standard
   - Viene aggiunto un timestamp se non presente
   - Vengono organizzati per sorgente

4. **Storage**:
   - I log vengono salvati in file JSON divisi per sorgente
   - Si implementa una rotazione semplice dei file per evitare una crescita eccessiva

5. **Consumo**:
   - Gli utenti possono consultare i log tramite la dashboard web
   - È possibile filtrare per sorgente, livello e testo
   - L'interfaccia si aggiorna automaticamente

## Integrazione con i servizi HRease

### Backend (Django)

L'integrazione con il backend Django avviene attraverso un semplice handler di logging:

```python
# apps/core/logging.py
import logging
import requests
import threading
from django.conf import settings

class SimpleLogHandler(logging.Handler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service_url = getattr(settings, 'LOGGING_SERVICE_URL', 'http://logging-service:8080')
        
    def emit(self, record):
        try:
            # Formatta il messaggio di log
            log_entry = self.format(record)
            
            # Prepara i dati per l'invio
            log_data = {
                'source': 'backend',
                'level': record.levelname.lower(),
                'message': log_entry,
                'meta': {
                    'module': record.module,
                    'function': record.funcName,
                    'line': record.lineno
                }
            }
            
            # Invia in modo asincrono per non bloccare l'applicazione
            threading.Thread(
                target=self._send_log,
                args=(log_data,),
                daemon=True
            ).start()
            
        except Exception:
            self.handleError(record)
    
    def _send_log(self, log_data):
        try:
            requests.post(
                f"{self.service_url}/api/logs",
                json=log_data,
                timeout=1
            )
        except:
            # Ignora errori di connessione
            pass
```

### Frontend (React)

Nel frontend, viene implementato un servizio di logging simile:

```typescript
// src/utils/logger.ts
const LOGGING_SERVICE_URL = process.env.REACT_APP_LOGGING_SERVICE_URL || 'http://localhost:8080';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private source: string = 'frontend';
  
  constructor() {
    // Intercetta gli errori non gestiti
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        stack: event.error?.stack
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason
      });
    });
  }
  
  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }
  
  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }
  
  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }
  
  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }
  
  private log(level: LogLevel, message: string, meta?: any): void {
    try {
      // Prepara i dati
      const logData = {
        source: this.source,
        level,
        message,
        meta: {
          ...meta,
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      };
      
      // Invia al servizio di logging
      fetch(`${LOGGING_SERVICE_URL}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData),
        // Usa keepalive per assicurarsi che la richiesta venga completata
        keepalive: true
      }).catch(() => {
        // Ignora errori di connessione
      });
      
      // Stampa anche nella console per lo sviluppo
      const consoleMethod = console[level] || console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, meta);
      
    } catch (error) {
      console.error('Error sending log:', error);
    }
  }
}

export default new Logger();
```

## Implementazione del microservizio

### Core del server Node.js

Il cuore del microservizio è un server Express che implementa la logica di base:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('ui'));

// Directory per lo storage dei log
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Log store semplificato
const logStore = {
  saveLog(source, log) {
    const logFile = path.join(LOG_DIR, `${source}.json`);
    let logs = [];
    
    // Leggi log esistenti
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      // Limita a 1000 log per file
      if (logs.length >= 1000) logs = logs.slice(-999);
    }
    
    // Aggiungi nuovo log con timestamp
    logs.push({
      timestamp: new Date().toISOString(),
      ...log
    });
    
    // Salva su file
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    return true;
  },
  
  getLogs(source, query = {}) {
    const logFile = path.join(LOG_DIR, `${source}.json`);
    if (!fs.existsSync(logFile)) return [];
    
    let logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    
    // Filtri semplici
    if (query.level) {
      logs = logs.filter(log => log.level === query.level);
    }
    
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      logs = logs.filter(log => 
        JSON.stringify(log).toLowerCase().includes(searchTerm)
      );
    }
    
    // Paginazione semplice
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 100;
    const startIndex = (page - 1) * limit;
    
    return logs.reverse().slice(startIndex, startIndex + limit);
  }
};

// API per ricevere log
app.post('/api/logs', (req, res) => {
  const { source, level, message, meta } = req.body;
  
  if (!source || !level || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  logStore.saveLog(source, { level, message, meta });
  res.status(201).json({ success: true });
});

// API per consultare log
app.get('/api/logs/:source', (req, res) => {
  const { source } = req.params;
  const logs = logStore.getLogs(source, req.query);
  res.json({ logs });
});

// Raccolta log da Docker
function collectDockerLogs() {
  const containers = ['backend', 'frontend', 'db'];
  
  containers.forEach(container => {
    const dockerLogs = spawn('docker', ['logs', `hrease-${container}-1`, '--tail', '50']);
    
    dockerLogs.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        logStore.saveLog('docker-' + container, {
          level: line.includes('ERROR') ? 'error' : 
                 line.includes('WARN') ? 'warn' : 'info',
          message: line
        });
      });
    });
  });
}

// Raccolta periodica di log Docker
setInterval(collectDockerLogs, 60000); // Ogni minuto

// Chiamata iniziale
collectDockerLogs();

// Server start
app.listen(PORT, () => {
  console.log(`Logging service running on port ${PORT}`);
});
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

### Configuration Docker Compose

```yaml
services:
  # ... servizi esistenti ...
  
  logging-service:
    build:
      context: ./logging-service
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - ./logs:/app/logs
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
    networks:
      - app-network
```

## Vantaggi del Sistema Semplificato

1. **Rapidità di implementazione**: Un sistema funzionale può essere realizzato in ore anziché giorni o settimane
2. **Basso overhead**: Minimo impatto sulle performance del sistema principale
3. **Poche dipendenze**: Non richiede database esterni o configurazioni complesse
4. **Manutenzione semplice**: Facile da capire, modificare e mantenere
5. **Approccio pragmatico**: Fornisce le funzionalità essenziali senza sovraingegnerizzazione

## Limitazioni e Considerazioni Future

1. **Scalabilità limitata**: Lo storage basato su file non è adatto per volumi enormi di log
2. **Funzionalità di ricerca basiche**: Supporta solo ricerche testuali semplici
3. **Senza replica**: Non ha ridondanza integrata
4. **Retention limitata**: Gestione elementare della retention dei log

In futuro, quando il progetto sarà più maturo, si potrà valutare l'implementazione di un sistema più avanzato o l'evoluzione graduale di questa soluzione.

## Piano di Evoluzione Potenziale

Se necessario, il sistema potrà evolversi nel tempo:

1. **Fase 1**: Sistema attuale basato su file
2. **Fase 2**: Aggiunta di database NoSQL leggero (ad es. LowDB o NeDB) per migliori query
3. **Fase 3**: Implementazione di grafici e visualizzazioni più avanzate
4. **Fase 4**: Migrazione opzionale a un database come MongoDB o Elasticsearch
5. **Fase 5**: Implementazione di alerting e analisi avanzate (solo se necessario)

## Conclusione

L'architettura semplificata del microservizio di logging rappresenta un compromesso pragmatico tra funzionalità e complessità. Fornisce una soluzione immediata ai bisogni di logging del sistema HRease, mantenendo la possibilità di un'evoluzione futura se e quando necessario.

Questo approccio permette di concentrarsi sullo sviluppo delle funzionalità core della piattaforma, ottenendo comunque i benefici della centralizzazione e standardizzazione dei log.