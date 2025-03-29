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
