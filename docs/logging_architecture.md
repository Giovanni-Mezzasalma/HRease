# Architettura del Microservizio di Logging per HRease

## Introduzione

Questo documento descrive l'architettura del microservizio di logging implementato in HRease. Il sistema è stato progettato come un servizio indipendente per fornire una soluzione centralizzata, scalabile e flessibile per la gestione dei log di tutti i componenti della piattaforma.

## Visione d'insieme

Il microservizio di logging ha lo scopo di:

1. Raccogliere log da tutti i componenti dell'ecosistema HRease (backend, frontend, altri servizi)
2. Centralizzare l'archiviazione dei log in un formato standardizzato
3. Offrire strumenti avanzati per la ricerca, analisi e visualizzazione dei log
4. Fornire meccanismi di alerting e notifica basati su eventi nei log
5. Supportare l'audit trail per operazioni critiche
6. Facilitare il debugging e la risoluzione dei problemi
7. Produrre analytics e insights relativi all'uso della piattaforma

## Architettura del Microservizio

![Architettura Logging](../diagrams/logging_architecture.png)

*Nota: Il diagramma sopra è un riferimento per la documentazione.*

### Componenti principali

#### 1. API Layer

- **Log Ingestion API**: Endpoint RESTful per la ricezione dei log da vari servizi
- **Log Query API**: Endpoint per la ricerca e recupero dei log
- **Admin API**: Endpoint per la configurazione e gestione del servizio di logging
- **Websocket Server**: Connessione in tempo reale per dashboard e alerting

#### 2. Processing Layer

- **Log Parser**: Normalizza e struttura i log in arrivo
- **Log Enricher**: Aggiunge metadati (timestamp, contesto, correlazioni)
- **Log Validator**: Verifica e filtra i log in base alle regole configurate
- **Retention Manager**: Gestisce la durata dei log e le politiche di archiviazione

#### 3. Storage Layer

- **Primary Storage**: Database ad alte prestazioni per log recenti (Elasticsearch)
- **Archive Storage**: Storage a lungo termine per log storici (Object Storage)
- **Index Manager**: Gestisce l'indicizzazione per ricerche efficienti

#### 4. Analytics Layer

- **Query Engine**: Motore per interrogazioni complesse sui log
- **Alerting Engine**: Monitoraggio e notifiche basate su pattern nei log
- **Report Generator**: Creazione di report periodici e dashboard
- **Machine Learning Module**: Rilevamento anomalie e pattern analysis (fase successiva)

#### 5. UI Layer

- **Admin Dashboard**: Interfaccia per la configurazione del servizio
- **Log Explorer**: Interfaccia per la ricerca e analisi dei log
- **Visualization Tools**: Grafici e visualizzazioni per analisi dei dati
- **Alert Manager**: Gestione e configurazione degli alert

## Flusso dei dati

1. **Generazione del log**:
   - I client (backend, frontend, servizi) generano eventi di log

2. **Ingestione**:
   - I log vengono inviati all'API di ingestione tramite chiamate HTTP o trasferimento batch
   - Per il frontend, i log vengono bufferizzati localmente e inviati periodicamente

3. **Processamento**:
   - I log vengono parsati, validati ed arricchiti
   - Viene assegnato un ID univoco e timestamp
   - Vengono aggiunti metadati contestuali

4. **Storage**:
   - I log vengono indicizzati e salvati nel database primario
   - In base alle politiche di retention, i log più vecchi vengono archiviati

5. **Consumo**:
   - Gli utenti accedono ai log tramite dashboard
   - I sistemi di alerting monitorano i log per eventi specifici
   - I report vengono generati automaticamente
   - Analytics avanzate vengono eseguite per ricavare insights

## Integrazione con i servizi HRease

### Backend (Django)

L'integrazione con il backend Django avviene attraverso:

```python
# Esempio di configurazione logging in settings/base.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'hrease_logging_service': {
            'level': 'INFO',
            'class': 'apps.core.logging.HReaseLoggingHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'hrease_logging_service'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'hrease_logging_service'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'hrease_logging_service'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

Il client per il microservizio di logging viene implementato come un custom handler:

```python
# apps/core/logging.py
import logging
import json
import requests
from django.conf import settings
import threading
import queue
import time

class HReaseLoggingHandler(logging.Handler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.buffer = queue.Queue()
        self.api_url = settings.LOGGING_SERVICE_URL
        self.api_key = settings.LOGGING_SERVICE_API_KEY
        self.batch_size = settings.LOGGING_BATCH_SIZE
        self.flush_interval = settings.LOGGING_FLUSH_INTERVAL
        
        # Start the background thread for sending logs
        self.worker = threading.Thread(target=self._worker, daemon=True)
        self.worker.start()
    
    def emit(self, record):
        try:
            log_entry = self.format(record)
            log_data = {
                'timestamp': time.time(),
                'service': 'django-backend',
                'level': record.levelname,
                'message': log_entry,
                'logger': record.name,
                'module': record.module,
                'function': record.funcName,
                'line': record.lineno,
                'context': {
                    'pid': record.process,
                    'thread': record.thread,
                    'path': record.pathname,
                }
            }
            
            # Add request information if available
            if hasattr(record, 'request'):
                log_data['context']['request'] = {
                    'method': record.request.method,
                    'path': record.request.path,
                    'user_id': record.request.user.id if record.request.user.is_authenticated else None,
                }
            
            self.buffer.put(log_data)
        except Exception as e:
            # Fallback to console in case of error
            print(f"Error in logging handler: {e}")
    
    def _worker(self):
        """Background worker to send logs in batches"""
        while True:
            try:
                batch = []
                # Collect logs up to batch size
                while len(batch) < self.batch_size:
                    try:
                        log_data = self.buffer.get(timeout=self.flush_interval)
                        batch.append(log_data)
                        self.buffer.task_done()
                    except queue.Empty:
                        break
                
                if batch:
                    self._send_logs(batch)
            except Exception as e:
                print(f"Error in logging worker: {e}")
            
            # Sleep a bit to avoid tight loop
            time.sleep(0.1)
    
    def _send_logs(self, batch):
        """Send logs to the logging service"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'X-API-Key': self.api_key
            }
            response = requests.post(
                f"{self.api_url}/api/v1/logs/batch",
                headers=headers,
                json=batch,
                timeout=5
            )
            if response.status_code >= 400:
                print(f"Error sending logs: {response.status_code} {response.text}")
        except Exception as e:
            print(f"Failed to send logs: {e}")
```

### Frontend (React)

Nel frontend, viene implementato un servizio di logging simile:

```typescript
// src/utils/logger.ts
interface LogData {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp?: number;
}

class LoggerService {
  private buffer: LogData[] = [];
  private maxBufferSize = 50;
  private flushInterval = 10000; // 10 seconds
  private apiUrl: string;
  private apiKey: string;
  private timer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.apiUrl = process.env.REACT_APP_LOGGING_SERVICE_URL || '';
    this.apiKey = process.env.REACT_APP_LOGGING_SERVICE_API_KEY || '';
    
    // Setup periodic flush
    this.timer = setInterval(() => this.flush(), this.flushInterval);
    
    // Flush logs on page unload
    window.addEventListener('beforeunload', () => this.flush());
    
    // Override console methods
    this.overrideConsole();
  }
  
  private overrideConsole() {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      this.debug(args[0], { additionalArgs: args.slice(1) });
    };
    
    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      this.info(args[0], { additionalArgs: args.slice(1) });
    };
    
    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      this.warn(args[0], { additionalArgs: args.slice(1) });
    };
    
    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      this.error(args[0], { additionalArgs: args.slice(1) });
    };
    
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }
  
  public debug(message: any, context?: Record<string, any>) {
    this.log('debug', message, context);
  }
  
  public info(message: any, context?: Record<string, any>) {
    this.log('info', message, context);
  }
  
  public warn(message: any, context?: Record<string, any>) {
    this.log('warn', message, context);
  }
  
  public error(message: any, context?: Record<string, any>) {
    this.log('error', message, context);
  }
  
  private log(level: LogData['level'], message: any, context?: Record<string, any>) {
    const logEntry: LogData = {
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now()
    };
    
    this.buffer.push(logEntry);
    
    // Auto-flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }
  
  public flush() {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    if (!this.apiUrl) {
      // Store in localStorage if API URL is not configured
      const storedLogs = JSON.parse(localStorage.getItem('hrease_logs') || '[]');
      const updatedLogs = [...storedLogs, ...logs].slice(-1000); // Keep only last 1000 logs
      localStorage.setItem('hrease_logs', JSON.stringify(updatedLogs));
      return;
    }
    
    // Send logs to the service
    fetch(`${this.apiUrl}/api/v1/logs/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        service: 'react-frontend',
        logs: logs
      }),
      // Use keepalive to ensure logs are sent even during page transitions
      keepalive: true
    }).catch(err => {
      // Store failed logs in localStorage
      const failedLogs = JSON.parse(localStorage.getItem('hrease_failed_logs') || '[]');
      localStorage.setItem('hrease_failed_logs', JSON.stringify([...failedLogs, ...logs]));
    });
  }
}

export const logger = new LoggerService();

export default logger;
```

## Implementazione del microservizio

### Tecnologie usate

Il microservizio di logging sarà implementato utilizzando:

- **Node.js** con **Express** per l'API layer
- **Elasticsearch** come database primario per i log
- **Kibana** per visualizzazione e analisi
- **Redis** per caching e gestione delle code
- **Docker** e **Kubernetes** per containerizzazione e orchestrazione
- **MinIO** o soluzione simile per object storage a lungo termine

### Struttura del progetto

```
logging-service/
├── api/                    # API endpoints
│   ├── routes/
│   ├── middlewares/
│   └── controllers/
├── core/                   # Business logic
│   ├── ingestion/
│   ├── processing/
│   ├── query/
│   └── analytics/
├── models/                 # Data models
├── services/               # External services integration
│   ├── elasticsearch/
│   ├── storage/
│   └── notification/
├── config/                 # Configuration
├── scripts/                # Utilities and scripts
├── test/                   # Tests
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Scalabilità e prestazioni

Il microservizio è progettato per scalare orizzontalmente:

- Architettura stateless per supportare repliche multiple
- Uso di Redis per condividere stato quando necessario
- Bulk processing per ottimizzare l'ingestione dei log
- Indici time-based per Elasticsearch
- Sharding e replica per alta disponibilità
- Hot-warm architecture per ottimizzare costi di storage
- Load balancing tra istanze

## Configurazione Docker e Docker Compose

Un esempio di configurazione Docker Compose per il microservizio di logging:

```yaml
version: '3.8'

services:
  logging-api:
    build:
      context: ./logging-service
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
      - API_KEY=${LOGGING_API_KEY}
    depends_on:
      - elasticsearch
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - logging-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    ports:
      - "9200:9200"
    environment:

# Definizione dell'architettura di alto livello per il microservizio di logging

L'architettura proposta sarà scalabile, flessibile e in grado di supportare tutti i moduli attuali e futuri della piattaforma.

## Componenti principali dell'architettura

L'architettura del microservizio di logging è composta da cinque layer principali, ciascuno con responsabilità ben definite:

### 1. API Layer
- **Ingestion API**: Riceve log dai client attraverso endpoint RESTful
- **Query API**: Consente la ricerca e il recupero dei log archiviati
- **Admin API**: Gestisce la configurazione del servizio e le impostazioni
- **Metrics API**: Fornisce metriche e statistiche sul funzionamento del servizio

### 2. Processing Layer
- **Log Parser**: Analizza e struttura i log in un formato standardizzato
- **Log Enricher**: Aggiunge metadati contestuali (timestamp, informazioni ambiente, correlazioni)
- **Log Validator**: Convalida i log e applica filtri configurati
- **Buffer Manager**: Gestisce l'accumulo dei log per operazioni batch efficienti verso lo storage

### 3. Storage Layer
- **Elasticsearch**: Database principale per i log recenti e ricerca ad alte prestazioni
- **Redis**: Cache e sistema di code per migliorare le performance e la resilienza
- **MinIO**: Storage a lungo termine per l'archiviazione economica dei log storici

### 4. Analytics Layer
- **Query Engine**: Elabora interrogazioni complesse sui dati di log
- **Alerting Engine**: Monitora i log e genera alert basati su pattern o soglie
- **Report Generator**: Crea report periodici e dashboard automatizzate
- **Machine Learning Module**: (Sviluppo futuro) Per analisi predittive e rilevamento anomalie

### 5. UI Layer
- **Admin Dashboard**: Interfaccia per la configurazione e il monitoring del servizio
- **Log Explorer**: Interfaccia per la ricerca e analisi dei log
- **Visualization Tools**: Componenti per visualizzare i dati in grafici e tabelle
- **Alert Manager**: Gestione delle regole di alerting e notifiche

## Stack tecnologico proposto

Per implementare questa architettura, propongo il seguente stack tecnologico:

- **Backend del microservizio**: Node.js con Express.js per le API
- **Database primario**: Elasticsearch (versione 7.17 o superiore)
- **Caching e code**: Redis
- **Archiviazione a lungo termine**: MinIO (compatibile con Amazon S3)
- **Frontend amministrativo**: React con TypeScript
- **Containerizzazione**: Docker e Docker Compose
- **Orchestrazione**: Kubernetes per ambienti di produzione (opzionale)
- **Visualizzazione**: Dashboard Kibana integrata + dashboard custom React

## Flusso dei dati

1. I client (frontend, backend, altri servizi) generano eventi di log
2. I log vengono inviati all'API di ingestione
   - Dal frontend: logs bufferizzati e inviati in batch
   - Dal backend: invio diretto o tramite libreria client
3. Il Processing Layer elabora, arricchisce e valida i log
4. I log vengono temporaneamente bufferizzati per ottimizzare le operazioni di scrittura
5. I log vengono scritti in Elasticsearch per l'accesso immediato
6. In base alle regole di retention, i log più vecchi vengono archiviati in MinIO
7. Il Query Engine supporta ricerche e aggregazioni avanzate
8. L'Alerting Engine monitora continuamente per pattern critici
9. L'UI Layer fornisce interfacce per visualizzare, analizzare e configurare il sistema

## Considerazioni tecniche

### Scalabilità
- Design stateless per supportare scaling orizzontale
- Sharding in Elasticsearch per distribuire il carico
- Buffer con Redis per gestire picchi di carico

### Resilienza
- Architettura a microservizi per isolamento dei guasti
- Meccanismo di retry per gestire fallimenti temporanei
- Rollup dei log per preservare informazioni aggregate anche dopo la scadenza dei log dettagliati

### Sicurezza
- Autenticazione basata su API key per tutti gli accessi
- TLS per tutte le comunicazioni
- Validazione rigorosa degli input
- Controllo degli accessi granulare
- Obfuscation automatica di dati sensibili nei log

### Deployment
- Container Docker per ogni componente
- Docker Compose per sviluppo e test
- Kubernetes consigliato per produzione

## Prossimi passi di implementazione

1. **Setup dell'infrastruttura Docker**:
   - Creare un Dockerfile per il microservizio di logging
   - Aggiungere i servizi Elasticsearch, Redis e MinIO al docker-compose.yml

2. **Implementazione del backend del microservizio**:
   - Strutturare il progetto Node.js/Express.js
   - Implementare gli endpoint API di base
   - Sviluppare i componenti del Processing Layer

3. **Integrazione con i client**:
   - Creare librerie client per backend (Python) e frontend (TypeScript)
   - Implementare il buffering e l'invio batch per il frontend

4. **Dashboard di amministrazione**:
   - Sviluppare l'interfaccia di visualizzazione e gestione log
   - Integrare con Kibana per visualizzazioni avanzate

5. **Testing e ottimizzazione**:
   - Test di carico per verificare scalabilità
   - Ottimizzazione delle query e dello storage

Questa architettura fornisce una solida base per un sistema di logging completo che supporterà tutti gli aspetti della piattaforma HRease, consentendo una facile estensione per supportare le funzionalità future previste nella roadmap.