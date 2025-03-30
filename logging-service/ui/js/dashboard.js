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
     * @param {string} level - Livello del log (debug, info, warn, error, critical)
     * @returns {string} - Classe Bootstrap per il badge
     */
    function getBadgeColor(level) {
      switch(level) {
        case 'critical': return 'dark';
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