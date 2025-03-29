## Interazione con il Microservizio di Logging Semplificato

### Configurazione dell'ambiente

Per sviluppare e interagire con il microservizio di logging semplificato, seguire questi passaggi:

1. Assicurarsi che le variabili d'ambiente siano configurate nel file `.env`:
   ```ini
   # Logging Service
   LOGGING_SERVICE_URL=http://logging-service:8080
   REACT_APP_LOGGING_SERVICE_URL=http://localhost:8080
   ```

2. Avviare il microservizio di logging insieme agli altri servizi:
   ```bash
   docker-compose up -d logging-service
   ```

3. Accedere alla dashboard di visualizzazione dei log:
   - URL Dashboard: http://localhost:8080

### Integrazione nel Backend (Django)

Per inviare log dal backend al microservizio di logging:

1. Configurare il logging in `settings/base.py`:
   ```python
   # Aggiungere questa configurazione
   LOGGING_SERVICE_URL = os.environ.get('LOGGING_SERVICE_URL', 'http://logging-service:8080')
   
   # Configurazione logger Django
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'simple': {
               'format': '{levelname} {asctime} {message}',
               'style': '{',
           },
       },
       'handlers': {
           'console': {
               'level': 'INFO',
               'class': 'logging.StreamHandler',
               'formatter': 'simple'
           },
           'simple_log_service': {
               'level': 'INFO',
               'class': 'apps.core.logging.SimpleLogHandler',
               'formatter': 'simple',
           },
       },
       'loggers': {
           'django': {
               'handlers': ['console', 'simple_log_service'],
               'level': 'INFO',
           },
           'apps': {
               'handlers': ['console', 'simple_log_service'],
               'level': 'INFO',
           },
       }
   }
   ```

2. Creare un handler di logging personalizzato in `apps/core/logging.py`:
   ```python
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

3. Utilizzare il logger come faresti normalmente in Django:
   ```python
   import logging
   
   logger = logging.getLogger(__name__)
   
   def my_view(request):
       logger.info("Elaborazione richiesta", extra={
           'user_id': request.user.id,
           'ip_address': request.META.get('REMOTE_ADDR')
       })
       # ... resto della view
   ```

### Integrazione nel Frontend (React)

Per inviare log dal frontend al microservizio di logging:

1. Aggiungere le variabili d'ambiente nel file `.env` frontend:
   ```
   REACT_APP_LOGGING_SERVICE_URL=http://localhost:8080
   ```

2. Creare un servizio di logging `src/utils/logger.ts`:
   ```typescript
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

3. Importare e utilizzare il logger nei componenti React:
   ```tsx
   import logger from '../../utils/logger';
   
   function MyComponent() {
     useEffect(() => {
       logger.info('Component mounted', { component: 'MyComponent' });
       
       return () => {
         logger.info('Component unmounted', { component: 'MyComponent' });
       };
     }, []);
     
     const handleClick = () => {
       try {
         // Operazione
         logger.info('Button clicked', { action: 'handleClick' });
       } catch (error) {
         logger.error('Error in click handler', { 
           error: error.message 
         });
       }
     };
     
     return (
       <div>
         <button onClick={handleClick}>Click Me</button>
       </div>
     );
   }
   ```

### Visualizzazione e Ricerca dei Log

Per visualizzare e cercare i log:

1. Accedere all'interfaccia web del microservizio all'indirizzo http://localhost:8080
2. Selezionare la sorgente dei log dal dropdown (es. 'backend', 'frontend', 'docker-backend')
3. Filtrare per livello di log: debug, info, warn, error
4. Utilizzare la barra di ricerca per trovare log specifici
5. Cliccare su "Refresh" per aggiornare manualmente i log (si aggiornano automaticamente ogni 10 secondi)

### Debug Usando i Log Docker

Il microservizio raccoglie anche i log dai container Docker, rendendo visibili gli output di console:

1. Selezionare 'docker-backend', 'docker-frontend' o 'docker-db' dal dropdown
2. I log mostrati sono gli stessi che vedresti con `docker-compose logs [service]`
3. Utile quando si verificano problemi di avvio o crash dei servizi

### Implementare il Microservizio di Logging

Per configurare il microservizio di logging nella tua installazione:

1. Creare una directory `logging-service` alla radice del progetto:
   ```bash
   mkdir -p logging-service/ui
   mkdir -p logging-service/logs
   ```

2. Creare il file `logging-service/package.json`:
   ```json
   {
     "name": "hrease-logging-service",
     "version": "0.1.0",
     "description": "Simple logging service for HRease",
     "main": "server.js",
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "cors": "^2.8.5",
       "body-parser": "^1.20.2"
     },
     "devDependencies": {
       "nodemon": "^2.0.22"
     }
   }
   ```

3. Creare il file `logging-service/server.js` con il codice del server descritto nella sezione "Architettura"

4. Creare il file `logging-service/Dockerfile`:
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .

   EXPOSE 8080

   CMD ["node", "server.js"]
   ```

5. Creare l'interfaccia utente in `logging-service/ui/index.html` (esempio nella sezione "Architettura")

6. Aggiornare il file `docker-compose.yml` per includere il servizio:
   ```yaml
   services:
     # ... altri servizi ...
     
     logging-service:
       build:
         context: ./logging-service
         dockerfile: Dockerfile
       ports:
         - "8080:8080"
       volumes:
         - ./logging-service/logs:/app/logs
         - /var/run/docker.sock:/var/run/docker.sock
       restart: unless-stopped
   ```

7. Avviare il servizio:
   ```bash
   docker-compose up -d logging-service
   ```

### Considerazioni sulle Performance

Il microservizio di logging è progettato per avere un impatto minimo sulle performance dell'applicazione principale:

1. **Backend**: I log vengono inviati in modo asincrono tramite thread separati
2. **Frontend**: I log vengono inviati con una priorità inferiore e con l'opzione `keepalive`
3. **Docker**: I log vengono raccolti periodicamente (ogni minuto) e solo gli ultimi 50 per container

### Manutenzione

Il sistema di log è stato progettato per richiedere minima manutenzione, ma ci sono alcune operazioni che potrebbero essere necessarie:

1. **Pulizia log**: I file JSON nella directory `logging-service/logs` possono essere eliminati periodicamente
2. **Riavvio**: In caso di problemi, riavviare il servizio con `docker-compose restart logging-service`
3. **Backup**: Eseguire backup dei file di log importanti copiandoli dalla directory `logging-service/logs`

Per esigenze più avanzate, il sistema può essere gradualmente esteso in futuro seguendo l'evoluzione descritta nella roadmap del progetto.