#!/bin/bash

# Script per creare la struttura del microservizio di logging semplificato per HRease
echo "Creating HRease Simple Logging Service structure..."

# Crea la directory principale
mkdir -p logging-service/logs
mkdir -p logging-service/ui

# Crea i file nella directory principale
echo "Creating main files..."
cat > logging-service/package.json << 'EOL'
{
  "name": "hrease-logging-service",
  "version": "0.1.0",
  "description": "Simple logging service for HRease platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "moment": "^2.29.4"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOL

echo "Creating server.js..."
cat > logging-service/server.js << 'EOL'
/**
 * HRease Logging Service - Server principale
 * 
 * Un microservizio semplificato per raccogliere, archiviare e visualizzare log
 * da varie fonti dell'ecosistema HRease (backend, frontend, container Docker).
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const moment = require('moment');

// Configurazione server
const app = express();
const PORT = process.env.PORT || 8080;
const MAX_LOGS_PER_FILE = 1000;  // Numero massimo di log per file JSON
const DOCKER_POLL_INTERVAL = 60000;  // Intervallo di polling dei log Docker (1 minuto)

// Middleware
app.use(cors());  // Abilita CORS per consentire richieste cross-origin
app.use(bodyParser.json());  // Parse del body JSON nelle richieste
app.use(express.static('ui'));  // Serve i file statici dalla directory 'ui'

// Stampa informazioni di avvio
console.log('HRease Logging Service - Starting up...');
console.log(`Server time: ${new Date().toISOString()}`);

// Configura la directory per lo storage dei log
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
  console.log(`Creating log directory: ${LOG_DIR}`);
  fs.mkdirSync(LOG_DIR);
}

/**
 * Log store - Gestisce lo storage e il recupero dei log
 * Implementa funzionalità di base per salvare e recuperare log da file JSON
 */
const logStore = {
  /**
   * Salva un log per una specifica sorgente
   * @param {string} source - Sorgente del log (es. 'backend', 'frontend')
   * @param {object} log - Oggetto contenente i dati del log
   * @returns {boolean} - True se l'operazione è riuscita
   */
  saveLog(source, log) {
    try {
      const logFile = path.join(LOG_DIR, `${source}.json`);
      let logs = [];
      
      // Leggi log esistenti se il file esiste
      if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf8');
        try {
          logs = JSON.parse(fileContent);
          // Limita a MAX_LOGS_PER_FILE log per file (rimuove i più vecchi)
          if (logs.length >= MAX_LOGS_PER_FILE) {
            logs = logs.slice(-MAX_LOGS_PER_FILE + 1);
          }
        } catch (parseError) {
          console.error(`Error parsing log file ${logFile}:`, parseError);
          // Se il file è corrotto, iniziamo con un array vuoto
          logs = [];
        }
      }
      
      // Aggiungi nuovo log con timestamp se non presente
      const newLog = {
        timestamp: log.timestamp || new Date().toISOString(),
        ...log
      };
      logs.push(newLog);
      
      // Salva su file (usa pretty printing per leggibilità, 2 spazi indentazione)
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving log:', error);
      return false;
    }
  },
  
  /**
   * Recupera log per una specifica sorgente con filtri opzionali
   * @param {string} source - Sorgente del log (es. 'backend', 'frontend')
   * @param {object} query - Parametri di query (level, search, page, limit)
   * @returns {array} - Array di oggetti log filtrati e paginati
   */
  getLogs(source, query = {}) {
    try {
      const logFile = path.join(LOG_DIR, `${source}.json`);
      if (!fs.existsSync(logFile)) return [];
      
      // Leggi e parse del file log
      let logs = [];
      try {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      } catch (parseError) {
        console.error(`Error parsing log file ${logFile}:`, parseError);
        return [];
      }
      
      // Applica filtri se presenti
      
      // Filtro per livello di log (es. 'error', 'info')
      if (query.level) {
        logs = logs.filter(log => log.level === query.level.toLowerCase());
      }
      
      // Filtro di ricerca testuale (cerca in tutto l'oggetto log)
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        logs = logs.filter(log => 
          JSON.stringify(log).toLowerCase().includes(searchTerm)
        );
      }
      
      // Filtro per timestamp (da data)
      if (query.from) {
        const fromDate = new Date(query.from).getTime();
        logs = logs.filter(log => new Date(log.timestamp).getTime() >= fromDate);
      }
      
      // Filtro per timestamp (a data)
      if (query.to) {
        const toDate = new Date(query.to).getTime();
        logs = logs.filter(log => new Date(log.timestamp).getTime() <= toDate);
      }
      
      // Inverti l'ordine per mostrare prima i più recenti
      logs = logs.reverse();
      
      // Applica paginazione
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 100;
      const startIndex = (page - 1) * limit;
      
      return logs.slice(startIndex, startIndex + limit);
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  },
  
  /**
   * Ottiene una lista di tutte le sorgenti di log disponibili
   * @returns {array} - Array di stringhe con i nomi delle sorgenti
   */
  getSources() {
    try {
      // Legge tutti i file .json nella directory di log
      const files = fs.readdirSync(LOG_DIR).filter(file => file.endsWith('.json'));
      // Estrae il nome della sorgente dal nome del file
      return files.map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error getting log sources:', error);
      return [];
    }
  }
};

/**
 * API per ricevere log
 * Endpoint POST che accetta log da varie sorgenti
 */
app.post('/api/logs', (req, res) => {
  // Estrai i dati dalla richiesta
  const { source, level, message, meta } = req.body;
  
  // Verifica che i campi obbligatori siano presenti
  if (!source || !level || !message) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      required: ['source', 'level', 'message'] 
    });
  }
  
  // Verifica che il livello sia valido
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(level.toLowerCase())) {
    return res.status(400).json({ 
      error: 'Invalid log level', 
      valid: validLevels 
    });
  }
  
  // Salva il log
  const success = logStore.saveLog(source, { level, message, meta });
  
  // Rispondi con status 201 (Created) se salvato con successo
  if (success) {
    return res.status(201).json({ success: true });
  } else {
    return res.status(500).json({ error: 'Failed to save log' });
  }
});

/**
 * API per consultare log
 * Endpoint GET che restituisce log filtrati per una specifica sorgente
 */
app.get('/api/logs/:source', (req, res) => {
  const { source } = req.params;
  const logs = logStore.getLogs(source, req.query);
  res.json({ logs });
});

/**
 * API per ottenere la lista delle sorgenti di log disponibili
 */
app.get('/api/sources', (req, res) => {
  const sources = logStore.getSources();
  res.json({ sources });
});

/**
 * Raccoglie log dai container Docker
 * Usa l'API Docker per leggere i log dai container e li salva nel logStore
 */
function collectDockerLogs() {
  console.log(`Collecting Docker logs at ${new Date().toISOString()}`);
  
  // Lista dei container da monitorare
  const containers = ['backend', 'frontend', 'db'];
  
  containers.forEach(container => {
    try {
      // Esegue il comando docker logs per ottenere gli ultimi 50 log
      const containerName = `hrease-${container}-1`;
      console.log(`Collecting logs for container: ${containerName}`);
      
      const dockerLogs = spawn('docker', ['logs', containerName, '--tail', '50']);
      
      // Gestisce l'output di stdout
      dockerLogs.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          // Determina il livello di log in base al contenuto
          let level = 'info';
          if (line.includes('ERROR') || line.includes('error')) {
            level = 'error';
          } else if (line.includes('WARN') || line.includes('warn')) {
            level = 'warn';
          } else if (line.includes('DEBUG') || line.includes('debug')) {
            level = 'debug';
          }
          
          // Salva il log nel formato standard
          logStore.saveLog(`docker-${container}`, {
            level,
            message: line,
            meta: {
              container: containerName,
              collected_at: new Date().toISOString()
            }
          });
        });
      });
      
      // Gestisce gli errori di stderr
      dockerLogs.stderr.on('data', (data) => {
        console.error(`Error collecting logs for ${containerName}:`, data.toString());
      });
      
      // Gestisce la chiusura del processo
      dockerLogs.on('close', (code) => {
        if (code !== 0) {
          console.error(`docker logs command exited with code ${code}`);
        }
      });
    } catch (error) {
      console.error(`Error collecting logs for ${container}:`, error);
    }
  });
}

// Raccolta iniziale di log Docker
collectDockerLogs();

// Imposta la raccolta periodica di log Docker
const dockerLogInterval = setInterval(collectDockerLogs, DOCKER_POLL_INTERVAL);

// Gestisce la terminazione del processo per pulizia
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  clearInterval(dockerLogInterval);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Avvia il server
const server = app.listen(PORT, () => {
  console.log(`Logging service running on port ${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`- POST /api/logs - Send logs`);
  console.log(`- GET /api/logs/:source - Get logs by source`);
  console.log(`- GET /api/sources - Get available log sources`);
});
EOL

echo "Creating Dockerfile..."
cat > logging-service/Dockerfile << 'EOL'
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
EOL

echo "Creating UI files..."
cat > logging-service/ui/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HRease - Log Dashboard</title>
  <!-- Bootstrap CSS per lo styling -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Font Awesome per le icone -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    /* Stile personalizzato per il dashboard */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f8f9fa;
    }
    
    .navbar-brand {
      font-weight: bold;
      color: #3498db !important;
    }
    
    .log-container {
      height: calc(100vh - 200px);
      min-height: 400px;
      overflow-y: auto;
      background-color: white;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .log-entry {
      padding: 10px;
      margin-bottom: 6px;
      border-radius: 4px;
      border-left: 4px solid transparent;
      transition: background-color 0.2s;
    }
    
    .log-entry:hover {
      background-color: rgba(0,0,0,0.025);
    }
    
    /* Colori per i diversi livelli di log */
    .log-debug { border-left-color: #6c757d; background-color: #f8f9fa; }
    .log-info { border-left-color: #17a2b8; background-color: #e3f2fd; }
    .log-warn { border-left-color: #ffc107; background-color: #fff3cd; }
    .log-error { border-left-color: #dc3545; background-color: #f8d7da; }
    
    .log-meta {
      background-color: rgba(0,0,0,0.03);
      border-radius: 4px;
      padding: 8px;
      margin-top: 6px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .timestamp {
      color: #6c757d;
      font-size: 12px;
    }
    
    /* Stile per i filtri temporali */
    .date-filter {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .date-filter label {
      margin-bottom: 0;
      white-space: nowrap;
    }
    
    /* Stile per lo stato di aggiornamento */
    .auto-refresh-status {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 5px;
    }
    
    .auto-refresh-active {
      background-color: #28a745;
    }
    
    .auto-refresh-paused {
      background-color: #dc3545;
    }
    
    /* Spinner per il caricamento */
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
    }
    
    /* Badge per conteggio log */
    .source-badge {
      background-color: #3498db;
      color: white;
      font-size: 0.75em;
      padding: 0.25em 0.5em;
      border-radius: 1em;
      margin-left: 0.5em;
    }
  </style>
</head>
<body>
  <!-- Navbar con il titolo -->
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
    <div class="container">
      <a class="navbar-brand" href="#">
        <i class="fas fa-stream me-2"></i>
        HRease - Log Dashboard
      </a>
      <div class="d-flex">
        <div class="me-2">
          <span class="auto-refresh-status auto-refresh-active" id="refreshStatus"></span>
          <span id="refreshText">Auto-refresh active</span>
        </div>
        <button id="toggleRefreshBtn" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-pause"></i>
        </button>
      </div>
    </div>
  </nav>

  <div class="container">
    <!-- Filtri -->
    <div class="row mb-4">
      <!-- Selettore sorgente -->
      <div class="col-md-3 mb-3 mb-md-0">
        <label for="sourceSelect" class="form-label">Source</label>
        <select id="sourceSelect" class="form-select">
          <option value="" disabled selected>Select a source...</option>
          <!-- Le opzioni verranno popolate dinamicamente -->
        </select>
      </div>
      
      <!-- Selettore livello -->
      <div class="col-md-2 mb-3 mb-md-0">
        <label for="levelSelect" class="form-label">Level</label>
        <select id="levelSelect" class="form-select">
          <option value="">All levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
      
      <!-- Input ricerca -->
      <div class="col-md-4 mb-3 mb-md-0">
        <label for="searchInput" class="form-label">Search</label>
        <input id="searchInput" type="text" class="form-control" placeholder="Search logs...">
      </div>
      
      <!-- Pulsante refresh -->
      <div class="col-md-3 d-flex align-items-end">
        <button id="refreshBtn" class="btn btn-primary w-100">
          <i class="fas fa-sync-alt me-1"></i> Refresh
        </button>
      </div>
    </div>
    
    <!-- Filtri temporali (nascosti inizialmente) -->
    <div class="row mb-4" id="dateFilters" style="display:none;">
      <div class="col-md-6 mb-3 mb-md-0">
        <div class="date-filter">
          <label for="fromDate" class="form-label">From:</label>
          <input type="datetime-local" id="fromDate" class="form-control">
        </div>
      </div>
      <div class="col-md-6">
        <div class="date-filter">
          <label for="toDate" class="form-label">To:</label>
          <input type="datetime-local" id="toDate" class="form-control">
        </div>
      </div>
    </div>
    
    <!-- Pulsante per mostrare/nascondere filtri temporali -->
    <div class="row mb-4">
      <div class="col-12">
        <button id="toggleDateFilters" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-calendar me-1"></i> Show date filters
        </button>
      </div>
    </div>
    
    <!-- Container per i log -->
    <div class="log-container p-3">
      <div id="logsOutput">
        <div class="text-center text-muted pt-5">
          <i class="fas fa-stream fa-3x mb-3"></i>
          <p>Select a source to view logs</p>
        </div>
      </div>
    </div>
    
    <!-- Paginazione -->
    <div class="d-flex justify-content-between align-items-center mt-3">
      <div>
        <span id="logCount" class="text-muted">0 logs</span>
      </div>
      <div>
        <button id="loadMoreBtn" class="btn btn-outline-primary" style="display: none;">
          Load more
        </button>
      </div>
    </div>
  </div>

  <!-- Script principale -->
  <script>
    /**
     * Dashboard di Log HRease
     * Script client-side per visualizzare e interagire con i log
     */
    document.addEventListener('DOMContentLoaded', function() {
      // Elementi DOM
      const logsOutput = document.getElementById('logsOutput');
      const sourceSelect = document.getElementById('sourceSelect');
      const levelSelect = document.getElementById('levelSelect');
      const searchInput = document.getElementById('searchInput');
      const refreshBtn = document.getElementById('refreshBtn');
      const fromDate = document.getElementById('fromDate');
      const toDate = document.getElementById('toDate');
      const toggleDateFilters = document.getElementById('toggleDateFilters');
      const dateFilters = document.getElementById('dateFilters');
      const logCount = document.getElementById('logCount');
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      const toggleRefreshBtn = document.getElementById('toggleRefreshBtn');
      const refreshStatus = document.getElementById('refreshStatus');
      const refreshText = document.getElementById('refreshText');
      
      // Stato dell'applicazione
      let state = {
        currentSource: '',
        currentPage: 1,
        autoRefresh: true,
        refreshInterval: null,
        logs: [],
        sources: []
      };
      
      // Inizializza l'intervallo di aggiornamento automatico (10 secondi)
      state.refreshInterval = setInterval(fetchLogs, 10000);
      
      // Configura gli event listeners
      refreshBtn.addEventListener('click', () => {
        state.currentPage = 1;
        fetchLogs();
      });
      
      sourceSelect.addEventListener('change', () => {
        state.currentSource = sourceSelect.value;
        state.currentPage = 1;
        fetchLogs();
      });
      
      levelSelect.addEventListener('change', () => {
        state.currentPage = 1;
        fetchLogs();
      });
      
      searchInput.addEventListener('input', debounce(() => {
        state.currentPage = 1;
        fetchLogs();
      }, 500));
      
      fromDate.addEventListener('change', () => {
        state.currentPage = 1;
        fetchLogs();
      });
      
      toDate.addEventListener('change', () => {
        state.currentPage = 1;
        fetchLogs();
      });
      
      toggleDateFilters.addEventListener('click', () => {
        const isVisible = dateFilters.style.display !== 'none';
        dateFilters.style.display = isVisible ? 'none' : 'flex';
        toggleDateFilters.innerHTML = isVisible ? 
          '<i class="fas fa-calendar me-1"></i> Show date filters' : 
          '<i class="fas fa-calendar-minus me-1"></i> Hide date filters';
      });
      
      loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        fetchLogs(true);
      });
      
      toggleRefreshBtn.addEventListener('click', () => {
        state.autoRefresh = !state.autoRefresh;
        
        if (state.autoRefresh) {
          state.refreshInterval = setInterval(fetchLogs, 10000);
          refreshStatus.classList.remove('auto-refresh-paused');
          refreshStatus.classList.add('auto-refresh-active');
          refreshText.textContent = 'Auto-refresh active';
          toggleRefreshBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          clearInterval(state.refreshInterval);
          refreshStatus.classList.remove('auto-refresh-active');
          refreshStatus.classList.add('auto-refresh-paused');
          refreshText.textContent = 'Auto-refresh paused';
          toggleRefreshBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
      });
      
      // Carica le sorgenti al caricamento della pagina
      fetchSources();
      
      /**
       * Recupera tutte le sorgenti di log disponibili
       */
      function fetchSources() {
        fetch('/api/sources')
          .then(response => response.json())
          .then(data => {
            state.sources = data.sources || [];
            
            // Popola il selettore delle sorgenti
            sourceSelect.innerHTML = '<option value="" disabled selected>Select a source...</option>';
            
            state.sources.forEach(source => {
              const option = document.createElement('option');
              option.value = source;
              option.textContent = source;
              sourceSelect.appendChild(option);
            });
            
            // Se non ci sono sorgenti, mostra un messaggio
            if (state.sources.length === 0) {
              const option = document.createElement('option');
              option.value = '';
              option.textContent = 'No sources available';
              option.disabled = true;
              sourceSelect.appendChild(option);
            }
          })
          .catch(error => {
            console.error('Error fetching sources:', error);
            logsOutput.innerHTML = '<div class="alert alert-danger">Error loading sources</div>';
          });
      }
      
      /**
       * Recupera i log dalla sorgente selezionata
       * @param {boolean} append - Se true, aggiunge i nuovi log a quelli esistenti
       */
      function fetchLogs(append = false) {
        // Se non è stata selezionata una sorgente, non fare nulla
        if (!state.currentSource) {
          return;
        }
        
        // Costruisci l'URL con i parametri di query
        const source = state.currentSource;
        const level = levelSelect.value;
        const search = searchInput.value;
        const from = fromDate.value;
        const to = toDate.value;
        const page = state.currentPage;
        const limit = 50; // Numero di log per pagina
        
        let url = `/api/logs/${source}?page=${page}&limit=${limit}`;
        if (level) url += `&level=${level}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (from) url += `&from=${encodeURIComponent(from)}`;
        if (to) url += `&to=${encodeURIComponent(to)}`;
        
        // Se non è un append, mostra un indicatore di caricamento
        if (!append) {
          logsOutput.innerHTML = `
            <div class="spinner-container">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          `;
        }
        
        // Recupera i log dal server
        fetch(url)
          .then(response => response.json())
          .then(data => {
            const logs = data.logs || [];
            
            if (append) {
              // Aggiungi i nuovi log a quelli esistenti
              state.logs = [...state.logs, ...logs];
            } else {
              // Sostituisci i log esistenti
              state.logs = logs;
            }
            
            // Visualizza i log
            displayLogs(state.logs);
            
            // Aggiorna il conteggio e lo stato del pulsante "load more"
            logCount.textContent = `${state.logs.length} logs`;
            
            // Mostra il pulsante "load more" solo se ci sono abbastanza log
            loadMoreBtn.style.display = logs.length >= limit ? 'block' : 'none';
          })
          .catch(error => {
            console.error('Error fetching logs:', error);
            if (!append) {
              logsOutput.innerHTML = '<div class="alert alert-danger">Error loading logs</div>';
            }
          });
      }
      
      /**
       * Visualizza i log nella UI
       * @param {Array} logs - Array di oggetti log da visualizzare
       */
      function displayLogs(logs) {
        if (!logs || logs.length === 0) {
          logsOutput.innerHTML = '<div class="text-center text-muted">No logs found</div>';
          return;
        }
        
        let html = '';
        logs.forEach(log => {
          // Formatta il timestamp in formato locale
          const timestamp = new Date(log.timestamp).toLocaleString();
          const level = log.level || 'info';
          
          html += `
            <div class="log-entry log-${level}">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <span class="badge bg-${getBadgeColor(level)}">${level.toUpperCase()}</span>
                </div>
                <small class="timestamp">${timestamp}</small>
              </div>
              <div class="log-message my-1">${escapeHtml(log.message)}</div>
              ${log.meta ? `<pre class="log-meta small">${escapeHtml(JSON.stringify(log.meta, null, 2))}</pre>` : ''}
            </div>
          `;
        });
        
        logsOutput.innerHTML = html;
      }
      
      /**
       * Determina il colore del badge in base al livello del log
       * @param {string} level - Livello del log (debug, info, warn, error)
       * @returns {string} - Classe Bootstrap per il badge
       */
      function getBadgeColor(level) {
        switch(level) {
          case 'error': return 'danger';
          case 'warn': return 'warning';
          case 'info': return 'info';
          case 'debug': return 'secondary';
          default: return 'primary';
        }
      }
      
      /**
       * Escapa caratteri HTML pericolosi per prevenire XSS
       * @param {string} unsafe - Stringa da escapare
       * @returns {string} - Stringa escapata
       */
      function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return JSON.stringify(unsafe);
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
      
      /**
       * Debounce: limita la frequenza di esecuzione di una funzione
       * @param {Function} func - Funzione da eseguire
       * @param {number} delay - Ritardo in millisecondi
       * @returns {Function} - Funzione con debounce
       */
      function debounce(func, delay) {
        let timeoutId;
        return function() {
          const context = this;
          const args = arguments;
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            func.apply(context, args);
          }, delay);
        };
      }
    });
  </script>
</body>
</html>
EOL

# Crea la directory per il code di integrazione in Django
mkdir -p backend/apps/core
echo "Creating Django integration file..."
cat > backend/apps/core/logging.py << 'EOL'
# backend/apps/core/logging.py
"""
Handler di logging personalizzato per inviare log al microservizio di logging.

Questo modulo definisce un handler che può essere usato con il sistema di logging
standard di Python/Django per inviare log al microservizio di logging centralizzato.
"""

import logging
import requests
import threading
import json
from datetime import datetime
from django.conf import settings

class SimpleLogHandler(logging.Handler):
    """
    Handler di logging che invia log al microservizio di logging via HTTP.
    
    Invia i log in modo asincrono tramite thread separati per evitare di
    bloccare l'applicazione principale durante l'invio.
    """
    
    def __init__(self, *args, **kwargs):
        """
        Inizializza l'handler con le configurazioni dal settings.py.
        
        Args:
            *args: Argomenti posizionali per la classe base Handler
            **kwargs: Argomenti keyword per la classe base Handler
        """
        super().__init__(*args, **kwargs)
        # Ottieni l'URL del servizio di logging dalle impostazioni
        self.service_url = getattr(settings, 'LOGGING_SERVICE_URL', 'http://logging-service:8080')
        # Stampa l'URL del servizio per aiutare nella configurazione
        print(f"SimpleLogHandler initialized with service URL: {self.service_url}")
    
    def emit(self, record):
        """
        Invia un record di log al microservizio.
        
        Si occupa di formattare il record, preparare i dati e
        avviare un thread separato per l'invio asincrono.
        
        Args:
            record: LogRecord da inviare
        """
        try:
            # Formatta il messaggio di log usando il formatter configurato
            log_entry = self.format(record)
            
            # Estrai eventuali dati extra dal record
            extra_data = {}
            for key, value in record.__dict__.items():
                if key not in logging.LogRecord('', 0, '', 0, '', (), None).__dict__:
                    # Tenta di serializzare in JSON, altrimenti usa str()
                    try:
                        if isinstance(value, (dict, list, tuple, str, int, float, bool, type(None))):
                            extra_data[key] = value
                        else:
                            extra_data[key] = str(value)
                    except Exception:
                        extra_data[key] = str(value)
            
            # Prepara i dati per l'invio
            log_data = {
                'source': 'backend',
                'level': record.levelname.lower(),
                'message': log_entry,
                'timestamp': datetime.utcnow().isoformat(),
                'meta': {
                    'module': record.module,
                    'function': record.funcName,
                    'line': record.lineno,
                    'process_id': record.process,
                    'thread_id': record.thread,
                    **extra_data  # Includi tutti i dati extra dal record
                }
            }
            
            # Invia in modo asincrono per non bloccare l'applicazione
            threading.Thread(
                target=self._send_log,
                args=(log_data,),
                daemon=True
            ).start()
            
        except Exception as e:
            # In caso di errore, usa il metodo handleError della classe base
            print(f"Error in SimpleLogHandler.emit: {e}")
            self.handleError(record)
    
    def _send_log(self, log_data):
        """
        Invia effettivamente il log al microservizio.
        
        Metodo destinato a essere eseguito in un thread separato.
        
        Args:
            log_data: Dati del log da inviare
        """
        try:
            # Timeout breve per evitare blocchi
            response = requests.post(
                f"{self.service_url}/api/logs",
                json=log_data,
                timeout=1
            )
            
            # Log di debug (stampato solo nella console)
            if response.status_code != 201:
                print(f"Failed to send log to service. Status: {response.status_code}, Response: {response.text}")
                
        except requests.RequestException as e:
            # Ignora errori di rete per evitare che problemi nel servizio di logging
            # causino problemi nell'applicazione principale
            print(f"Error sending log to service: {e}")
        except Exception as e:
            print(f"Unexpected error in log handler: {e}")
EOL

# Crea la directory per il codice di integrazione in React
mkdir -p frontend/src/utils
echo "Creating React integration file..."
cat > frontend/src/utils/logger.ts << 'EOL'
/**
 * Logging Service Client for HRease Frontend
 * 
 * Questo modulo fornisce funzionalità di logging per il frontend di HRease
 * inviando log al microservizio di logging centralizzato.
 */

// URL del servizio di logging (da variabili d'ambiente)
const LOGGING_SERVICE_URL = process.env.REACT_APP_LOGGING_SERVICE_URL || 'http://localhost:8080';

/**
 * Livelli di log supportati
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Classe Logger per il frontend
 * Fornisce metodi per inviare log di diversi livelli al microservizio
 */
class Logger {
  /** Nome della sorgente di log (sempre 'frontend' per questa implementazione) */
  private source: string = 'frontend';
  
  /** Determina se i messaggi di debug vengono inviati al server */
  private sendDebugToServer: boolean = process.env.NODE_ENV !== 'production';
  
  /** Tenant ID per ambienti multi-tenant (opzionale) */
  private tenantId?: string;
  
  /** Utente corrente (opzionale) */
  private userId?: string | number;
  
  /**
   * Inizializza il logger e configura i listener per errori non gestiti
   */
  constructor() {
    console.log(`Logger initialized with service URL: ${LOGGING_SERVICE_URL}`);
    
    // Intercetta gli errori non gestiti
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Intercetta le promise rejection non gestite
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: typeof event.reason === 'object' ? event.reason : { message: String(event.reason) },
        stack: event.reason?.stack
      });
    });
  }
  
  /**
   * Imposta l'ID dell'utente corrente per includere nei log
   * @param userId - ID dell'utente
   */
  setUserId(userId: string | number | undefined): void {
    this.userId = userId;
  }
  
  /**
   * Imposta l'ID del tenant per ambienti multi-tenant
   * @param tenantId - ID del tenant
   */
  setTenantId(tenantId: string | undefined): void {
    this.tenantId = tenantId;
  }
  
  /**
   * Invia un log di livello DEBUG
   * @param message - Messaggio del log
   * @param meta - Metadati aggiuntivi (opzionale)
   */
  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }
  
  /**
   * Invia un log di livello INFO
   * @param message - Messaggio del log
   * @param meta - Metadati aggiuntivi (opzionale)
   */
  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }
  
  /**
   * Invia un log di livello WARN
   * @param message - Messaggio del log
   * @param meta - Metadati aggiuntivi (opzionale)
   */
  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }
  
  /**
   * Invia un log di livello ERROR
   * @param message - Messaggio del log
   * @param meta - Metadati aggiuntivi (opzionale)
   */
  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }
  
  /**
   * Metodo principale che gestisce tutti i livelli di log
   * @param level - Livello del log
   * @param message - Messaggio del log
   * @param meta - Metadati aggiuntivi (opzionale)
   */
  private log(level: LogLevel, message: string, meta?: any): void {
    try {
      // Stampa sempre nella console per lo sviluppo locale
      this.logToConsole(level, message, meta);
      
      // Per i log di debug, invia al server solo in modalità sviluppo
      if (level === 'debug' && !this.sendDebugToServer) {
        return;
      }
      
      // Prepara i dati da inviare
      const logData = {
        source: this.source,
        level,
        message,
        timestamp: new Date().toISOString(),
        meta: {
          ...meta,
          url: window.location.href,
          userAgent: navigator.userAgent,
          // Includi informazioni utente se disponibili
          ...(this.userId ? { userId: this.userId } : {}),
          ...(this.tenantId ? { tenantId: this.tenantId } : {})
        }
      };
      
      // Invia al servizio di logging
      this.sendToService(logData);
      
    } catch (error) {
      // Se si verifica un errore nel logging, stampa solo nella console
      console.error('Error in logger:', error);
    }
  }
  
  /**
   * Invia i dati del log al microservizio
   * @param logData - Dati del log da inviare
   */
  private sendToService(logData: any): void {
    try {
      fetch(`${LOGGING_SERVICE_URL}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData),
        // Usa keepalive per assicurarsi che la richiesta venga completata
        // anche se l'utente naviga via dalla pagina
        keepalive: true
      }).catch((error) => {
        // Ignora errori di rete per non compromettere l'esperienza utente
        console.warn('Failed to send log to service:', error);
      });
    } catch (error) {
      console.warn('Error sending log to service:', error);
    }
  }
  
  /**
   * Stampa il log nella console del browser
   * @param level - Livello del log
   * @param message - Messaggio del log
   * @param meta - Metadati aggiuntivi (opzionale)
   */
  private logToConsole(level: LogLevel, message: string, meta?: any): void {
    const prefix = `[${level.toUpperCase()}]`;
    
    // Usa il metodo console appropriato per il livello
    switch (level) {
      case 'debug':
        console.debug(prefix, message, meta || '');
        break;
      case 'info':
        console.info(prefix, message, meta || '');
        break;
      case 'warn':
        console.warn(prefix, message, meta || '');
        break;
      case 'error':
        console.error(prefix, message, meta || '');
        break;
    }
  }
}

// Esporta un'istanza singola del logger
export default new Logger();
EOL

# Aggiorna il docker-compose.yml
echo "Updating docker-compose.yml with logging service..."
cat > docker-compose.yml.update << 'EOL'
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
EOL

echo "Creating .env update..."
cat > .env.update << 'EOL'
# Logging Service
LOGGING_SERVICE_URL=http://logging-service:8080
REACT_APP_LOGGING_SERVICE_URL=http://localhost:8080
EOL

echo "Done! 🎉"
echo ""
echo "Instructions:"
echo "1. Run this script to create all necessary files:"
echo "   chmod +x create_logging_service.sh && ./create_logging_service.sh"
echo ""
echo "2. Add the logging service to your docker-compose.yml file:"
echo "   Add the contents of docker-compose.yml.update to your docker-compose.yml file"
echo ""
echo "3. Add the logging environment variables to your .env file:"
echo "   Add the contents of .env.update to your .env file"
echo ""
echo "4. Update Django settings to use the SimpleLogHandler in settings/base.py"
echo ""
echo "5. Start the logging service with Docker Compose:"
echo "   docker-compose up -d logging-service"
echo ""
echo "6. Access the dashboard at http://localhost:8080"