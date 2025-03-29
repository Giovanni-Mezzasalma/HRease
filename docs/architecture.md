# Architettura di HRease

## Panoramica

HRease è una piattaforma modulare per la gestione delle risorse umane, progettata per essere scalabile e facilmente estensibile. L'architettura è stata concepita per supportare un approccio incrementale allo sviluppo, consentendo di aggiungere nuovi moduli e funzionalità nel tempo.

## Architettura Complessiva

![Architettura HRease](../diagrams/architecture_overview.png)

*Nota: Il diagramma sopra è un riferimento per future implementazioni.*

### Pattern Architetturale

HRease utilizza un'architettura a microservizi, con:

- **Backend**: API REST basate su Django e Django REST Framework
- **Frontend**: Single Page Application (SPA) basata su React
- **Database**: PostgreSQL come datastore principale
- **Logging Service**: Microservizio dedicato per la gestione centralizzata dei log
- **Reverse Proxy**: NGINX per routing e servire contenuti statici

## Architettura Backend

Il backend di HRease è organizzato secondo i principi dell'architettura modulare Django, con separazione chiara delle funzionalità in app Django dedicate.

### Struttura delle App

- **accounts**: Gestione utenti, profili e autenticazione
- **core**: Funzionalità condivise e utility comuni
- **leaves**: Gestione delle ferie e dei permessi (primo modulo in sviluppo)

### Modello di Dati

#### App Accounts

![Modello Accounts](../diagrams/accounts_model.png)

- **User**: Estende AbstractUser di Django con campi aggiuntivi per HR:
  - `email`: Campo email univoco (usato per login)
  - `job_title`: Titolo lavorativo
  - `department`: Dipartimento
  - `hire_date`: Data di assunzione

#### App Leaves

![Modello Leaves](../diagrams/leaves_model.png)

- **LeaveType**: Tipi di assenza (es. ferie, malattia, permesso)
  - `name`: Nome del tipo di assenza
  - `is_paid`: Indica se è un'assenza retribuita
  - `color_code`: Codice colore per UI

- **LeaveRequest**: Richieste di assenza
  - `user`: Chi richiede l'assenza
  - `leave_type`: Tipo di assenza
  - `start_date`/`end_date`: Periodo di assenza
  - `status`: Stato della richiesta (pending, approved, rejected, cancelled)

- **Holiday**: Festività
  - `name`: Nome della festività
  - `date`: Data
  - `is_recurring`: Se si ripete annualmente

### Autenticazione e Sicurezza

Il sistema utilizza JWT (JSON Web Tokens) per l'autenticazione, con:

- Token di accesso con durata limitata
- Token di refresh per ottenere nuovi token di accesso
- Gestione delle autorizzazioni basata su permessi e gruppi Django

## Architettura Frontend

Il frontend è una SPA sviluppata con React e TypeScript.

### Struttura dei Componenti

- **Components**: Componenti UI riutilizzabili
- **Pages**: Viste complete dell'applicazione
- **Contexts**: Gestione dello stato dell'applicazione
- **Services**: Comunicazione con le API backend
- **Hooks**: Hook React personalizzati
- **Utils**: Utility e helper

## Architettura del Microservizio di Logging Semplificato

Il sistema di logging è implementato come un microservizio leggero per garantire tracciabilità delle operazioni e facilitare il debugging senza aggiungere complessità eccessiva all'architettura complessiva.

![Architettura Logging Semplificata](../diagrams/logging_simple_architecture.png)

*Nota: Il diagramma sopra è un riferimento per future implementazioni.*

### Componenti principali

- **Server Node.js/Express**: Core del microservizio che espone API REST per la ricezione e consultazione dei log
- **Storage basato su file JSON**: Archiviazione semplice dei log senza dipendenze da database esterni
- **Collettori di log**: Componenti per raccogliere log da diverse fonti (backend, frontend, container Docker)
- **Dashboard web**: Interfaccia utente HTML/CSS/JS per visualizzare e filtrare i log

### Integrazione con altri servizi

- Il backend e il frontend inviano log al microservizio tramite API REST
- I log dei container Docker vengono raccolti periodicamente tramite CLI Docker
- L'interfaccia web fornisce una visualizzazione centralizzata di tutti i log

*Per maggiori dettagli, consultare [logging_architecture.md](./logging_architecture.md)*

### Flusso dei dati

1. **Generazione**: Le applicazioni generano eventi di log durante l'esecuzione
2. **Invio**: I log vengono inviati in modo asincrono al microservizio
3. **Processamento**: Il microservizio normalizza e organizza i log
4. **Storage**: I log vengono salvati in file JSON organizzati per sorgente
5. **Consultazione**: L'interfaccia web permette di visualizzare e filtrare i log

### Vantaggi dell'approccio semplificato

- Implementazione rapida con poche dipendenze
- Basso overhead operativo
- Facile manutenzione e comprensione
- Può evolvere gradualmente in base alle esigenze

### Possibile evoluzione futura

Il sistema è progettato per essere esteso gradualmente nel tempo:
1. **Fase 1**: Sistema attuale basato su file (implementazione corrente)
2. **Fase 2**: Aggiunta di database NoSQL leggero per query migliorate
3. **Fase 3**: Implementazione di grafici e visualizzazioni più avanzate
4. **Fase 4**: Integrazione con sistemi di monitoraggio esterni (opzionale)

## Infrastruttura e Deployment

### Containerizzazione

L'applicazione è completamente containerizzata con Docker:

- Container separati per backend, frontend, database, logging service e nginx
- Docker Compose per orchestrazione locale
- Volumi per persistenza dei dati

### CI/CD

La pipeline CI/CD è implementata con GitHub Actions:

- Test automatici per backend e frontend
- Build delle immagini Docker
- Push su Docker Hub
- *Deploy su ambiente di produzione (pianificato)*

## Considerazioni di Scalabilità

L'architettura attuale supporta la scalabilità tramite:

- Database PostgreSQL affidabile e scalabile
- Applicazioni stateless che permettono scaling orizzontale
- Separazione in microservizi che consentono scaling indipendente
- Logging centralizzato per monitoraggio e troubleshooting efficaci

## Piano di Evoluzione Architetturale

Con la crescita della piattaforma, sono previste le seguenti evoluzioni:

1. Implementazione di un sistema di caching (Redis)
2. Autenticazione tramite OAuth2/OpenID Connect
3. Implementazione di un bus di eventi per integrazioni
4. Microservizi dedicati per moduli ad alta intensità di calcolo
5. Evoluzione del microservizio di logging con capacità di analisi predittiva

## Considerazioni Tecniche

### Performance

- Utilizzo di Django ORM con ottimizzazione delle query
- Lazy loading e code splitting nel frontend
- Indici di database appropriati
- Elaborazione asincrona per operazioni intensive

### Sicurezza

- HTTPS obbligatorio in produzione
- Validazione input lato client e server
- Protezione contro CSRF, XSS e SQL Injection
- Sanitizzazione dei dati in input/output
- Logging completo delle operazioni sensibili

### Scalabilità

- Componenti stateless
- Sessioni basate su JWT
- Architettura a microservizi
- Possibilità di load balancing

## Conclusioni

L'architettura di HRease è progettata per fornire una base solida per lo sviluppo incrementale della piattaforma, mantenendo flessibilità, sicurezza e scalabilità. L'adozione di un'architettura a microservizi, a partire dal sistema di logging, garantisce che la piattaforma possa evolversi in modo sostenibile nel tempo.