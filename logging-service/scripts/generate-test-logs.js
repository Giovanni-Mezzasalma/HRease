/**
 * Script per generare log di test direttamente nei file JSON
 */
const fs = require('fs');
const path = require('path');

// Parametri configurabili
const numLogs = parseInt(process.argv[2] || '20');
const source = process.argv[3] || 'test-rotation';
const LOG_DIR = path.join(__dirname, '..', 'logs');

// Livelli di log disponibili
const levels = ['debug', 'info', 'warn', 'error'];

/**
 * Genera un numero specificato di log di test
 */
function generateTestLogs() {
  console.log(`Generazione di ${numLogs} log di test per la sorgente '${source}'...`);
  
  // Percorso del file di log
  const logFile = path.join(LOG_DIR, `${source}.json`);
  
  // Crea la directory dei log se non esiste
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  // Leggi il file di log esistente o inizializza un array vuoto
  let logs = [];
  if (fs.existsSync(logFile)) {
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(content);
    } catch (error) {
      console.error(`Errore nella lettura del file ${logFile}:`, error);
    }
  }
  
  // Genera nuovi log
  for (let i = 1; i <= numLogs; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = `Test log #${i} - Questo è un messaggio di log di test per verificare la rotazione`;
    
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: {
        testId: `test-${Date.now()}`,
        iteration: i,
        randomValue: Math.random()
      }
    });
    
    console.log(`Log #${i} aggiunto (${level})`);
  }
  
  // Salva i log nel file
  try {
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    console.log(`File ${logFile} aggiornato con ${numLogs} nuovi log`);
    console.log(`Totale log nel file: ${logs.length}`);
  } catch (error) {
    console.error(`Errore nel salvataggio del file ${logFile}:`, error);
  }
}

// Esegui la generazione
generateTestLogs();