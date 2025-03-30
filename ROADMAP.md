# Roadmap HRease - Aggiornata

## Vision Generale

HRease si svilupperà in fasi successive, adottando un approccio modulare che consente di aggiungere funzionalità mantenendo un'architettura solida e coerente. Ogni fase è progettata per fornire valore immediato agli utenti mentre costruiamo le fondamenta per le funzionalità future.

## Stato Attuale (Marzo 2025)
Il progetto ha completato le fasi iniziali dell'infrastruttura tecnica, con l'implementazione della struttura di base sia per il backend che per il frontend. Sono stati creati i modelli di dati fondamentali e sono state integrate le funzionalità di autenticazione di base. L'accesso con JWT è stato testato e funziona correttamente.

### Modifiche Recenti
- ✅ Correzione dell'URL API nel frontend (aggiunta del prefisso `/v1`)
- ✅ Aggiornamento del file `.env.example` con l'URL API corretto
- ✅ Implementazione completa del microservizio di logging semplificato

## Legenda:
- [ ] Non ancora fatto.
- [/] In corso.
- [x] Attività conclusa.
## Modulo 1: Gestione Ferie e Permessi (Q2 2025 - Q1 2026)

### Fase 1: Fondamenta Tecniche e Architettura (Marzo - Maggio 2025)
- [x] Setup infrastruttura containerizzata (Docker, Docker Compose)
- [x] Implementazione CI/CD con GitHub Actions
- [x] Struttura base backend Django/DRF
- [x] Struttura base frontend React/TypeScript
- [x] Configurazione database PostgreSQL
- [x] Implementazione microservizio di logging semplificato
  - [x] 1.1 Definizione dell'architettura di alto livello
  - [x] 1.2 Setup container Docker dedicato per il servizio di logging
    - [x] 1.2.1 Creazione struttura directory del microservizio
    - [x] 1.2.2 Creazione Dockerfile specifico
    - [x] 1.2.3 Creazione package.json con dipendenze necessarie
    - [x] 1.2.4 Aggiornamento docker-compose.yml per includere il servizio
    - [x] 1.2.5 Implementazione server Express base
    - [x] 1.2.6 Aggiunta variabili d'ambiente al file .env
    - [x] 1.2.7 Test di avvio e funzionamento del container
  - [x] 1.3 Implementazione dello storage basato su file JSON
    - [x] 1.3.1 Creazione sistema di storage con rotazione dei file
    - [x] 1.3.2 Configurazione directory per i log
    - [x] 1.3.3 Implementazione funzioni base di lettura/scrittura
  - [x] 1.4 Implementazione API RESTful essenziali
    - [x] 1.4.1 Endpoint per ricezione log
    - [x] 1.4.2 Endpoint per consultazione log
    - [x] 1.4.3 Validazione base dell'input
  - [x] 1.5 Creazione UI web semplice
    - [x] 1.5.1 Dashboard HTML con Bootstrap
    - [x] 1.5.2 Funzionalità base di filtro e ricerca
    - [x] 1.5.3 Visualizzazione e aggiornamento automatico
  - [x] 1.6 Integrazione con Docker per raccolta log container
    - [x] 1.6.1 Implementazione collettore di log Docker
    - [x] 1.6.2 Configurazione accesso socket Docker
  - [/] 1.7 Verifica e test dell'implementazione del microservizio di logging
    - [/] 1.7.1 Test dell'integrazione con il backend Django
      - [/] 1.7.1.1 Implementare logger di test in una view Django
      - [/] 1.7.1.2 Verificare la corretta ricezione dei log nel microservizio
      - [/] 1.7.1.3 Validare la visualizzazione dei log nella dashboard
    - [ ] 1.7.2 Test dell'integrazione con il frontend React
      - [ ] 1.7.2.1 Aggiungere logging nei componenti chiave
      - [ ] 1.7.2.2 Verificare la corretta propagazione degli eventi utente
      - [ ] 1.7.2.3 Testare il logging degli errori non gestiti
    - [ ] 1.7.3 Test dello storage e della rotazione dei log
      - [ ] 1.7.3.1 Generare volume di log per testare la rotazione
      - [ ] 1.7.3.2 Verificare la corretta archiviazione e persistenza
    - [ ] 1.7.4 Test delle funzionalità di ricerca e filtraggio
      - [ ] 1.7.4.1 Testare i filtri per livello, testo e data
      - [ ] 1.7.4.2 Verificare la paginazione e caricamento incrementale
    - [ ] 1.7.5 Documentazione delle funzionalità implementate
      - [ ] 1.7.5.1 Aggiornare la documentazione per sviluppatori
      - [ ] 1.7.5.2 Creare guida all'uso della dashboard di logging
- [ ] Completamento sistema di autenticazione e gestione utenti
  - [x] Modelli di base per gli utenti
  - [x] API di autenticazione JWT
  - [ ] Frontend di login/registrazione
  - [x] Risoluzione problemi di autenticazione
- [ ] Implementazione API pattern fondamentali
  - [ ] Definizione specifiche API OpenAPI/Swagger
  - [ ] Endpoint CRUD di base
- [ ] Design system UI base
  - [ ] Definizione palette colori, tipografia, componenti
  - [ ] Implementazione componenti di base React
  - [ ] Integrazione TailwindCSS

**Milestone**: Demo dell'autenticazione, navigazione di base e microservizio di logging (Fine Maggio 2025)

### Fase 2: Funzionalità Core Gestione Ferie (Giugno - Settembre 2025)
- [ ] Affinamento modelli dati per ferie, permessi e festività
  - [ ] Implementazione logica di calcolo giorni lavorativi
  - [ ] Configurazione regole aziendali
- [ ] API REST completa per operazioni CRUD
  - [ ] Endpoint per richieste ferie/permessi
  - [ ] Endpoint per approvazioni
  - [ ] Endpoint per visualizzazione calendari
- [ ] Frontend per richiesta/approvazione ferie
  - [ ] Form di richiesta ferie
  - [ ] Visualizzazione stato richieste
  - [ ] Interfaccia approvazione per manager
- [ ] Calendario visualizzazione assenze
  - [ ] Vista mensile/settimanale
  - [ ] Filtri per reparto/team
- [ ] Sistema di notifiche
  - [ ] Integrazione con il microservizio di logging per tracciamento eventi
  - [ ] Sistema di notifiche per nuove richieste
  - [ ] Notifiche di approvazione/rifiuto

**Milestone**: MVP funzionale per gestione base ferie (Fine Settembre 2025)

### Fase 3: Funzionalità Avanzate e Polishing (Ottobre 2025 - Gennaio 2026)
- [ ] Reportistica e analytics ferie
  - [ ] Dashboard statistiche utilizzo ferie
  - [ ] Report per team/reparto
- [ ] Esportazione dati (CSV, Excel)
- [ ] Sistema di notifiche avanzato (email)
- [ ] Gestione festività nazionali/locali
  - [ ] Importazione calendari festività
  - [ ] Configurazione festività specifiche aziendali
- [ ] Personalizzazione regole aziendali
  - [ ] Configurazione workflow approvazione
  - [ ] Regole accumulo/scadenza ferie
- [ ] Interfaccia mobile responsive
- [ ] Ottimizzazione performance
- [ ] User testing e iterazioni

**Milestone**: Rilascio ufficiale Modulo Ferie v1.0 (Gennaio 2026)

## Modulo 2: Reperibilità (Q2-Q3 2026)

### Fase 1: Preparazione e Analisi (Febbraio - Marzo 2026)
- [ ] Analisi requisiti dettagliata
- [ ] Design database e API
- [ ] Prototipazione UI/UX
- [ ] Estensione del microservizio di logging per supportare eventi di reperibilità

### Fase 2: Funzionalità Core Reperibilità (Aprile - Luglio 2026)
- [ ] Modelli dati per turni di reperibilità
- [ ] Pianificazione calendari di reperibilità
- [ ] Gestione compensi e straordinari
- [ ] Dashboard per coordinatori
- [ ] Visualizzazione turni personali
- [ ] Notifiche automatizzate turni
- [ ] Logging di eventi critici durante i turni

**Milestone**: MVP Reperibilità (Luglio 2026)

### Fase 3: Funzionalità Avanzate Reperibilità (Agosto - Ottobre 2026)
- [ ] Scambio turni tra dipendenti
- [ ] Reportistica utilizzo reperibilità
- [ ] Integrazioni con sistemi di allerta
- [ ] Gestione straordinari e compensazioni

**Milestone**: Rilascio Modulo Reperibilità v1.0 (Ottobre 2026)

## Modulo 3: Smart Working (Q4 2026 - Q2 2027)

### Fase 1: Preparazione e Analisi (Novembre - Dicembre 2026)
- [ ] Analisi requisiti dettagliata
- [ ] Design database e API
- [ ] Prototipazione UI/UX
- [ ] Aggiornamento microservizio di logging per monitorare accessi remoti

### Fase 2: Funzionalità Core Smart Working (Gennaio - Marzo 2027)
- [ ] Pianificazione giornate di lavoro remoto
- [ ] Policy aziendali per smart working
- [ ] Approvazione richieste
- [ ] Dashboard occupazione uffici
- [ ] Integrazione con modulo ferie

**Milestone**: MVP Smart Working (Marzo 2027)

### Fase 3: Funzionalità Avanzate Smart Working (Aprile - Giugno 2027)
- [ ] Prenotazione postazioni in ufficio
- [ ] Analytics sull'utilizzo smart working
- [ ] Reportistica per normative compliance
- [ ] Integrazione con strumenti di produttività
- [ ] Gestione accordi personalizzati

**Milestone**: Rilascio Modulo Smart Working v1.0 (Giugno 2027)

## Modulo 4: Timesheet (Q3-Q4 2027)

### Fase 1: Preparazione e Analisi (Luglio - Agosto 2027)
- [ ] Analisi requisiti dettagliata
- [ ] Design database e API
- [ ] Prototipazione UI/UX
- [ ] Configurazione tracciamento attività nel microservizio di logging

### Fase 2: Funzionalità Core Timesheet (Settembre - Novembre 2027)
- [ ] Registrazione ore lavorative
- [ ] Categorizzazione per progetto/cliente
- [ ] Approvazione timesheet da manager
- [ ] Dashboard personale
- [ ] Reportistica base

**Milestone**: MVP Timesheet (Novembre 2027)

### Fase 3: Funzionalità Avanzate Timesheet (Dicembre 2027 - Febbraio 2028)
- [ ] Integrazione con sistemi di fatturazione
- [ ] Analytics avanzate per management
- [ ] Previsioni e allocazione risorse
- [ ] Timesheet automatizzati (integrazione calendar)
- [ ] Esportazione per sistemi di paghe

**Milestone**: Rilascio Modulo Timesheet v1.0 (Febbraio 2028)

## Evoluzione del Microservizio di Logging (2026-2028)

### 2026 - Miglioramenti Incrementali
- [ ] Miglioramento dell'interfaccia utente con grafici e dashboard
- [ ] Sistemi di alerting basati su pattern nei log
- [ ] Aggiunta di retention policies configurabili
- [ ] Supporto per metriche base di sistema

### 2027 - Espansione delle Funzionalità
- [ ] Miglioramento dello storage con supporto per database NoSQL
- [ ] Integrazione con sistemi di monitoring esterni
- [ ] Dashboard personalizzabili per ciascun modulo
- [ ] Tracciamento avanzato delle azioni utente

### 2028 - Potenziale Migrazione al Sistema Completo
- [ ] Valutazione della migrazione al sistema di logging completo originale
- [ ] Implementazione di analytics avanzati (solo se necessario)
- [ ] Integrazione con sistemi di BI esterni
- [ ] Supporto per estensioni di terze parti

## Sviluppo Continuo e Integrazioni (2026-2028)

### Miglioramenti Piattaforma
- [ ] API pubblica per integrazioni di terze parti
- [ ] Single Sign-On (SSO)
- [ ] Integrazione con sistemi di paghe
- [ ] Integrazione con strumenti di produttività (Google Workspace, Microsoft 365)
- [ ] Mobile app nativa
- [ ] Analytics cross-modulo
- [ ] Dashboard executive per KPI HR

### Release e Manutenzione
- Rilasci di patch di sicurezza: Continui
- Rilasci di bug-fix: Mensili
- Rilasci di nuove feature: Trimestrali
- Major version release: Annuali

## Principi di Sviluppo e Metriche

### Principi di Sviluppo
- Approccio pragmatico con focus sulle funzionalità essenziali prima
- Architettura modulare per facilità di espansione
- Test-driven development per garantire qualità
- Backward compatibility per ogni aggiornamento
- Accessibilità come requisito fondamentale
- User experience coerente tra moduli
- Logging centralizzato ma leggero per tutte le operazioni critiche

### Metriche di Rilascio
- Copertura test: ≥ 80% per ogni modulo
- Tempo di risposta API: < 200ms per il 95% delle richieste
- Accessibilità: WCAG 2.1 AA o superiore
- Sicurezza: Zero vulnerabilità critiche
- Soddisfazione utente: > 4/5 nei test
- Tempo di deployment: < 30 minuti dall'approvazione
- Completezza dei log: 100% delle operazioni critiche tracciate

### Revisioni della Roadmap
- Revisione trimestrale degli obiettivi e tempistiche
- Aggiornamento semestrale della roadmap completa
- Feedback continuo degli utenti per prioritizzazione