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
