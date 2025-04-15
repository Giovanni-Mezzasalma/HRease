/**
 * Modulo per la gestione della rotazione dei file di log
 */
const fs = require('fs');
const path = require('path');

/**
 * Funzione che controlla e ruota i file di log se necessario
 * @param {string} logDir - Directory dove sono archiviati i log
 * @param {number} maxLogsPerFile - Numero massimo di log per file
 * @param {number} maxBackupFiles - Numero massimo di file di backup da mantenere
 */
function checkAndRotateLogs(logDir, maxLogsPerFile, maxBackupFiles) {
  console.log(`[${new Date().toISOString()}] Checking logs for rotation...`);
  
  // Ottieni tutti i file JSON nella directory dei log
  const logFiles = fs.readdirSync(logDir)
    .filter(file => file.endsWith('.json') && !file.includes('-rotated-'));
  
  logFiles.forEach(file => {
    try {
      const filePath = path.join(logDir, file);
      
      // Leggi il contenuto del file
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      let logs = [];
      
      try {
        logs = JSON.parse(content);
      } catch (e) {
        console.error(`Error parsing log file ${file}:`, e);
        return;
      }
      
      // Controlla se il file ha superato il limite di log
      if (logs.length >= maxLogsPerFile) {
        rotateLogFile(logDir, file, logs, maxBackupFiles);
      }
    } catch (error) {
      console.error(`Error checking rotation for file ${file}:`, error);
    }
  });
}

/**
 * Ruota un file di log specifico
 * @param {string} logDir - Directory dove sono archiviati i log
 * @param {string} filename - Nome del file da ruotare
 * @param {Array} logs - Contenuto del file di log
 * @param {number} maxBackupFiles - Numero massimo di file di backup da mantenere
 */
function rotateLogFile(logDir, filename, logs, maxBackupFiles) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const baseFilename = filename.replace('.json', '');
    const rotatedFilename = `${baseFilename}-rotated-${timestamp}.json`;
    const originalFilePath = path.join(logDir, filename);
    const rotatedFilePath = path.join(logDir, rotatedFilename);
    
    console.log(`Rotating log file: ${filename} -> ${rotatedFilename}`);
    
    // Copia il file corrente nel file di backup
    fs.writeFileSync(rotatedFilePath, JSON.stringify(logs, null, 2));
    
    // Crea un nuovo file vuoto
    fs.writeFileSync(originalFilePath, JSON.stringify([], null, 2));
    
    // Elimina i file di backup in eccesso
    cleanupOldRotatedFiles(logDir, baseFilename, maxBackupFiles);
    
    console.log(`Log rotation complete for ${filename}`);
  } catch (error) {
    console.error(`Error rotating log file ${filename}:`, error);
  }
}

/**
 * Elimina i file di backup più vecchi se superano il numero massimo
 * @param {string} logDir - Directory dove sono archiviati i log
 * @param {string} baseFilename - Nome base del file senza estensione
 * @param {number} maxBackupFiles - Numero massimo di file di backup da mantenere
 */
function cleanupOldRotatedFiles(logDir, baseFilename, maxBackupFiles) {
  try {
    // Ottieni tutti i file di backup per questa sorgente
    const rotatedFiles = fs.readdirSync(logDir)
      .filter(file => file.startsWith(`${baseFilename}-rotated-`) && file.endsWith('.json'));
    
    // Se abbiamo più file di backup di quanti ne vogliamo mantenere
    if (rotatedFiles.length > maxBackupFiles) {
      // Ordina i file per data (più vecchi prima)
      rotatedFiles.sort((a, b) => {
        const dateA = extractDateFromFilename(a);
        const dateB = extractDateFromFilename(b);
        return dateA - dateB;
      });
      
      // Elimina i file più vecchi
      const filesToDelete = rotatedFiles.slice(0, rotatedFiles.length - maxBackupFiles);
      filesToDelete.forEach(file => {
        const filePath = path.join(logDir, file);
        console.log(`Deleting old rotated file: ${file}`);
        fs.unlinkSync(filePath);
      });
    }
  } catch (error) {
    console.error(`Error cleaning up old rotated files:`, error);
  }
}

/**
 * Estrae la data dal nome del file ruotato
 * @param {string} filename - Nome del file ruotato
 * @returns {Date} - Oggetto data
 */
function extractDateFromFilename(filename) {
  try {
    const dateString = filename.match(/-rotated-(.+)\.json/)[1];
    return new Date(dateString.replace(/-/g, ':'));
  } catch (e) {
    // In caso di errore, ritorna una data molto vecchia
    return new Date(0);
  }
}

module.exports = {
  checkAndRotateLogs
};