# HRease - Piattaforma di Gestione Risorse Umane

![Stato](https://img.shields.io/badge/stato-in%20sviluppo-yellow)
![Versione](https://img.shields.io/badge/versione-0.1.0-blue)
![Licenza](https://img.shields.io/badge/licenza-MIT-green)

Una piattaforma modulare completa per la gestione delle risorse umane, progettata specificamente per piccole e medie imprese. HRease semplifica i processi HR con un'architettura scalabile che cresce insieme alle tue esigenze aziendali.

## 🌟 Vision

HRease nasce per offrire alle PMI una soluzione HR accessibile, flessibile e potente, eliminando la necessità di strumenti multipli e disallineati. La piattaforma si espande modularmente, permettendo alle aziende di iniziare con funzionalità essenziali e aggiungere capacità avanzate quando necessario.

## 📊 Moduli Pianificati

- **Gestione Ferie e Permessi** (in sviluppo)
  - Richiesta e approvazione assenze
  - Calcolo automatico ore residue
  - Visualizzazione calendario aziendale
  - Gestione festività nazionali e locali

- **Reperibilità** (pianificato)
  - Pianificazione turni di reperibilità
  - Gestione compensi e recuperi
  - Notifiche automatiche

- **Smart Working** (pianificato)
  - Pianificazione giornate di lavoro remoto
  - Reportistica sull'utilizzo
  - Gestione policy aziendali

- **Timesheet** (pianificato)
  - Registrazione ore lavorate
  - Categorizzazione per progetti/clienti
  - Reportistica dettagliata
  - Esportazione per fatturazione

## 🛠️ Stack Tecnologico

### Backend
- Django 5.x / Django REST Framework
- PostgreSQL 15+
- JWT per autenticazione
- Architettura modulare per espansione facile

### Frontend
- React 18+ con TypeScript
- Architettura a componenti riutilizzabili
- Design system consistente
- Visualizzazioni responsive per mobile/desktop

### DevOps
- Docker e Docker Compose
- CI/CD con GitHub Actions
- Deployment semplificato

## 🎯 Vantaggi per le PMI

- **Costi ridotti**: soluzione all-in-one che elimina la necessità di software multipli
- **Semplicità**: interfaccia intuitiva che richiede formazione minima
- **Flessibilità**: adattabile a diverse politiche aziendali
- **Crescita graduale**: possibilità di attivare nuovi moduli quando necessario
- **Compliance**: aiuta a rispettare normative sul lavoro e privacy

## 📋 Prerequisiti

- Docker e Docker Compose
- Git

## 🚦 Getting Started

1. Clona il repository:
   ```bash
   git clone https://github.com/tuousername/hrease.git
   cd hrease
   ```

2. Copia il file di esempio delle variabili d'ambiente:
   ```bash
   cp .env.example .env
   ```

3. Personalizza il file `.env` con le tue configurazioni

4. Avvia l'ambiente di sviluppo:
   ```bash
   docker-compose up -d
   ```

5. Inizializza il database:
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

6. Accedi all'applicazione:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api/
   - Admin Django: http://localhost:8000/admin/

## 🧪 Testing

Esegui i test automatizzati:

```bash
# Test backend
docker-compose exec backend python manage.py test

# Test frontend
docker-compose exec frontend npm test
```

## 📝 Documentazione

La documentazione dettagliata è disponibile nella cartella [docs](./docs):

- [Architettura](./docs/architecture.md)
- [API Reference](./docs/api-reference.md)
- [Guida all'implementazione](./docs/implementation-guide.md)
- [Guida utente](./docs/user-guide.md)

## 🗺️ Roadmap

Consulta la [roadmap](./roadmap.md) per dettagli sul piano di sviluppo e l'ordine di implementazione dei moduli.

## 🔄 Stato Attuale dello Sviluppo

Attualmente stiamo sviluppando il modulo di **Gestione Ferie e Permessi** come componente fondamentale della piattaforma. Questo modulo servirà come base architetturale per tutti gli sviluppi futuri, definendo pattern e best practices che verranno adottati nei moduli successivi.

## 🤝 Contributing

Le contribuzioni sono benvenute! Consulta il file [CONTRIBUTING.md](./CONTRIBUTING.md) per maggiori dettagli.

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](./LICENSE) per dettagli.

## 📞 Contatti

Per informazioni, partnership o supporto: [tua@email.com](mailto:tua@email.com).