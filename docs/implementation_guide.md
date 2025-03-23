# Guida all'implementazione di HRease

## Introduzione

Questa guida fornisce istruzioni dettagliate per configurare, sviluppare ed estendere la piattaforma HRease. È rivolta agli sviluppatori che lavoreranno sul progetto e documenta le best practices stabilite.

## Setup dell'ambiente di sviluppo

### Frontend

- Scrivi test per componenti e funzionalità
- Usa Jest e React Testing Library
- Implementa test unitari e di integrazione
- Simula chiamate API con mock service worker

Esempio:
```tsx
// LeaveRequestCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaveRequestCard } from './LeaveRequestCard';

describe('LeaveRequestCard', () => {
  const mockLeaveRequest = {
    id: 1,
    leave_type: { id: 1, name: 'Ferie', color_code: '#3498db' },
    start_date: '2025-08-01',
    end_date: '2025-08-15',
    status: 'pending',
    reason: 'Vacanza estiva'
  };

  test('renders leave request information correctly', () => {
    render(<LeaveRequestCard leaveRequest={mockLeaveRequest} />);
    
    expect(screen.getByText('Ferie')).toBeInTheDocument();
    expect(screen.getByText(/01\/08\/2025/)).toBeInTheDocument();
    expect(screen.getByText(/15\/08\/2025/)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  test('calls onApprove when approve button is clicked', () => {
    const mockOnApprove = jest.fn();
    
    render(
      <LeaveRequestCard 
        leaveRequest={mockLeaveRequest} 
        onApprove={mockOnApprove} 
      />
    );
    
    fireEvent.click(screen.getByText('Approve'));
    expect(mockOnApprove).toHaveBeenCalledWith(1);
  });
});
```

## Database

### Migrations

- Crea migrazioni per ogni modifica ai modelli
- Controlla le migrazioni prima di commitarle
- Includi commenti descrittivi nelle migrazioni complesse

```bash
# Genera migrazioni
docker-compose exec backend python manage.py makemigrations

# Verifica le migrazioni
docker-compose exec backend python manage.py showmigrations

# Applica le migrazioni
docker-compose exec backend python manage.py migrate
```

### Schema

- Utilizza i constraints del database per garantire l'integrità dei dati
- Aggiungi indici per le colonne frequentemente interrogate
- Usa campi di audit (created_at, updated_at) per tutti i modelli

## Estensione della piattaforma

### Aggiunta di nuovi moduli

1. Crea una nuova app Django:
   ```bash
   docker-compose exec backend python manage.py startapp module_name apps/module_name
   ```

2. Aggiungi l'app a `INSTALLED_APPS` nelle impostazioni di Django.

3. Definisci i modelli e crea le migrazioni.

4. Implementa views, serializers e urls per API REST.

5. Crea componenti React per il frontend.

6. Documenta il nuovo modulo in questa guida.

### Personalizzazione

- Ogni modulo può essere personalizzato tramite impostazioni di configurazione
- Usa modelli di dati flessibili con campi JSON per configurazioni estensibili
- Implementa hooks per estendere comportamenti senza modificare il codice core

## Deployment

### Ambiente di produzione

1. Configura le variabili d'ambiente di produzione
2. Genera una chiave segreta sicura
3. Disabilita il debug mode
4. Configura HTTPS tramite NGINX o servizio cloud
5. Configura backup automatici del database

### CI/CD

Il progetto usa GitHub Actions per CI/CD:

- I test vengono eseguiti automaticamente su ogni push e pull request
- Le immagini Docker vengono create e pubblicate per i branch `main` e `develop`
- Il deployment può essere automatizzato dopo la fase di build

## Troubleshooting

### Comuni problemi di sviluppo

#### Problema: Database migrations conflicts
**Soluzione**: Resetta il database in sviluppo o risolvi manualmente il conflitto.

```bash
# Opzione 1: Reset database
docker-compose down -v
docker-compose up -d
docker-compose exec backend python manage.py migrate

# Opzione 2: Risolvi conflitto
docker-compose exec backend python manage.py makemigrations --merge
```

#### Problema: Frontend non riesce a connettersi alle API
**Soluzione**: Verifica la configurazione CORS e gli URL delle API.

#### Problema: Permessi di file in Docker
**Soluzione**: Modifica i permessi dei file se necessario:

```bash
sudo chown -R $USER:$USER .
```

### Logs

Accedi ai logs dei container per il debug:

```bash
# Tutti i logs
docker-compose logs

# Logs specifici
docker-compose logs backend

# Logs in tempo reale
docker-compose logs -f backend
```
## Interazione con il Microservizio di Logging

### Configurazione dell'ambiente

Per sviluppare e interagire con il microservizio di logging, seguire questi passaggi:

1. Assicurarsi che le variabili d'ambiente siano configurate nel file `.env`:
   ```ini
   # Logging Service
   LOGGING_SERVICE_URL=http://logging-service:8080
   LOGGING_SERVICE_API_KEY=your_secure_api_key
   LOGGING_BATCH_SIZE=50
   LOGGING_FLUSH_INTERVAL=10000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   ```

2. Avviare il microservizio di logging insieme agli altri servizi:
   ```bash
   docker-compose up -d logging-service
   ```

3. Accedere alla dashboard di visualizzazione dei log:
   - Kibana: http://localhost:5601
   - Dashboard personalizzata: http://localhost:8080/dashboard

### Integrazione nel Backend (Django)

Per inviare log dal backend al microservizio di logging:

1. Configurare il logging in `settings/base.py`:
   ```python
   # Aggiungere questa configurazione
   LOGGING_SERVICE_URL = os.environ.get('LOGGING_SERVICE_URL', 'http://logging-service:8080')
   LOGGING_SERVICE_API_KEY = os.environ.get('LOGGING_SERVICE_API_KEY', '')
   LOGGING_BATCH_SIZE = int(os.environ.get('LOGGING_BATCH_SIZE', 50))
   LOGGING_FLUSH_INTERVAL = float(os.environ.get('LOGGING_FLUSH_INTERVAL', 10.0))
   
   # Configurazione logger Django
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'verbose': {
               'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
               'style': '{',
           },
       },
       'handlers': {
           'console': {
               'level': 'INFO',
               'class': 'logging.StreamHandler',
               'formatter': 'verbose'
           },
           'hrease_logging_service': {
               'level': 'INFO',
               'class': 'apps.core.logging.HReaseLoggingHandler',
               'formatter': 'verbose',
           },
       },
       'root': {
           'handlers': ['console', 'hrease_logging_service'],
           'level': 'INFO',
       },
       'loggers': {
           'django': {
               'handlers': ['console', 'hrease_logging_service'],
               'level': 'INFO',
               'propagate': False,
           },
           'apps': {
               'handlers': ['console', 'hrease_logging_service'],
               'level': 'INFO',
               'propagate': False,
           },
       },
   }
   ```

2. Creare l'handler personalizzato in `apps/core/logging.py` (vedere il documento [logging_architecture.md](./logging_architecture.md) per il codice completo)

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
   REACT_APP_LOGGING_SERVICE_API_KEY=your_secure_api_key
   ```

2. Importare e utilizzare il servizio di logging nelle componenti React:
   ```typescript
   import logger from '../utils/logger';
   
   function MyComponent() {
     useEffect(() => {
       logger.info('Componente montato', { componentName: 'MyComponent' });
       
       return () => {
         logger.info('Componente smontato', { componentName: 'MyComponent' });
       };
     }, []);
     
     const handleClick = () => {
       try {
         // Operazioni
         logger.info('Operazione completata', { operation: 'handleClick' });
       } catch (error) {
         logger.error('Errore durante operazione', { 
           operation: 'handleClick',
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

### Recupero e Analisi dei Log

Per analizzare i log attraverso la dashboard:

1. Accedere a Kibana (http://localhost:5601)
2. Creare un index pattern per i log (es. `logs-*`)
3. Utilizzare la sezione "Discover" per esplorare i log
4. Creare visualizzazioni e dashboard personalizzate

In alternativa, utilizzare l'API di query per accedere ai log programmaticamente:

```typescript
// Esempio di utilizzo dell'API
async function fetchLogs(query) {
  const response = await fetch(`${LOGGING_SERVICE_URL}/api/v1/logs/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(query)
  });
  
  return await response.json();
}

// Esempio di query
const query = {
  timeRange: {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // ultimi 24 ore
    to: new Date().toISOString()
  },
  filters: [
    { field: 'level', value: 'error' },
    { field: 'service', value: 'django-backend' }
  ],
  size: 100,
  sort: [{ field: 'timestamp', order: 'desc' }]
};

// Utilizzo
fetchLogs(query).then(logs => console.log(logs));
```

### Implementazione di Alert e Monitoraggio

Per configurare alert basati sui log:

1. Accedere alla dashboard di amministrazione del logging service
2. Navigare alla sezione "Alerts & Monitoring"
3. Creare una nuova regola di alert (es. "Errori 5xx nell'ultima ora > 10")
4. Configurare il canale di notifica (email, Slack, webhook)
5. Impostare la severità e la soglia di frequenza

In alternativa, utilizzare l'API per creare alert programmaticamente:

```bash
curl -X POST http://localhost:8080/api/v1/alerts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "name": "High Error Rate Alert",
    "description": "Alert when error rate is too high",
    "query": {
      "timeRange": {"from": "now-1h", "to": "now"},
      "filters": [{"field": "level", "value": "error"}]
    },
    "conditions": {
      "count": {"gt": 10}
    },
    "actions": [{
      "type": "email",
      "recipients": ["admin@example.com"],
      "subject": "High Error Rate Alert"
    }],
    "throttle": "10m"
  }'
```

### Sviluppo e Test del Microservizio

Per contribuire allo sviluppo del microservizio di logging:

1. Clonare il repository e navigare alla directory del servizio:
   ```bash
   cd logging-service
   ```

2. Installare le dipendenze:
   ```bash
   npm install
   ```

3. Eseguire i test:
   ```bash
   npm test
   ```

4. Avviare il servizio in modalità sviluppo:
   ```bash
   npm run dev
   ```

5. Per un ambiente completo con Elasticsearch e Kibana:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   
## Best Practices

### Sicurezza

- Non committare mai credentials o secret keys in repository
- Implementa validazione input sia frontend che backend
- Segui il principio del privilegio minimo per gli utenti
- Implementa rate limiting per prevenire attacchi

### Performance

- Usa caching per ridurre carico del database
- Ottimizza le query con `select_related` e `prefetch_related`
- Implementa paginazione per tutti gli endpoint che restituiscono liste
- Utilizza lazy loading per componenti React

### Manutenibilità

- Mantieni una copertura di test elevata
- Documenta le funzionalità complesse
- Usa strumenti di linting (pylint, eslint)
- Implementa typings con TypeScript
- Segui convenzioni di stile consistenti

## Roadmap e Piano di Sviluppo

Consultare il file [ROADMAP.md](../ROADMAP.md) per il piano di sviluppo dettagliato e la pianificazione dei moduli futuri.

## Conclusione

Questa guida fornisce una base solida per lo sviluppo della piattaforma HRease. Sarà aggiornata regolarmente con nuove best practices e moduli man mano che il progetto evolve.

Per domande o suggerimenti, contattare il team di sviluppo o aprire una issue su GitHub. Prerequisiti

- Docker e Docker Compose
- Git
- Editor di codice (consigliato VS Code con estensioni per Python, Django e React)

### Setup iniziale

1. Clona il repository:
   ```bash
   git clone https://github.com/yourusername/hrease.git
   cd hrease
   ```

2. Crea il file delle variabili d'ambiente:
   ```bash
   cp .env.example .env
   ```

3. Personalizza il file `.env` con i valori appropriati:
   ```ini
   # Database
   DB_NAME=hrease_db
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_HOST=db
   DB_PORT=5432

   # Django
   DEBUG=True
   SECRET_KEY=your_secret_key_here
   ALLOWED_HOSTS=localhost,127.0.0.1
   DJANGO_SETTINGS_MODULE=hrease.settings.development

   # Email (se necessario)
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your_email@example.com
   EMAIL_HOST_PASSWORD=your_email_password

   # Frontend
   REACT_APP_API_URL=http://localhost:8000/api
   NODE_ENV=development
   ```

4. Avvia l'ambiente Docker:
   ```bash
   docker-compose up -d
   ```

5. Applica le migrazioni e crea un superuser:
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

6. Accedi all'applicazione:
   - Backend API: http://localhost:8000/api/
   - Admin Django: http://localhost:8000/admin/
   - Frontend: http://localhost:3000/

### Workflow di sviluppo

1. Crea un branch per la tua feature:
   ```bash
   git checkout -b feature/nome-feature
   ```

2. Implementa la tua funzionalità

3. Esegui i test:
   ```bash
   # Test backend
   docker-compose exec backend pytest
   
   # Test frontend
   docker-compose exec frontend npm test
   ```

4. Crea una pull request verso il branch `develop`

## Convenzioni di codifica

### Backend (Django)

#### Struttura delle App

- Crea app Django modulari e focalizzate
- Segui il principio "Fat models, thin views"
- Utilizza `apps/` come namespace per le app Django

#### Modelli

- Crea classi di modello con nomi significativi in CamelCase singolare
- Aggiungi docstring alle classi e metodi complessi
- Implementa il metodo `__str__` per ogni modello
- Crea property calcolate quando appropriato

Esempio:
```python
class LeaveRequest(models.Model):
    """
    Rappresenta una richiesta di assenza da parte di un dipendente.
    """
    STATUS_CHOICES = [
        ('pending', 'In attesa'),
        ('approved', 'Approvato'),
        ('rejected', 'Rifiutato'),
        ('cancelled', 'Annullato'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    def __str__(self):
        return f"{self.user} - {self.start_date} to {self.end_date}"
    
    @property
    def duration(self):
        """Calcola la durata in giorni."""
        delta = self.end_date - self.start_date
        return delta.days + 1
```

#### Views (DRF)

- Organizza le view in viewsets
- Usa mixins per comportamenti comuni
- Implementa filtri e ordinamento
- Implementa paginazione consistente

Esempio:
```python
class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint per gestire le richieste di assenza.
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'leave_type']
    search_fields = ['reason']
    ordering_fields = ['start_date', 'created_at']
    
    def get_queryset(self):
        """
        Limita le richieste visibili in base al ruolo dell'utente.
        """
        user = self.request.user
        if user.is_staff or user.has_perm('leaves.view_all_leaves'):
            return LeaveRequest.objects.all()
        return LeaveRequest.objects.filter(user=user)
```

### Frontend (React)

#### Struttura dei componenti

- Organizza i componenti per funzionalità
- Crea componenti riutilizzabili e atomici
- Usa TypeScript per type safety

#### Convenzioni per i componenti

- Un componente per file
- Nome del file e del componente in PascalCase
- Styles in file separati usando CSS Modules

Esempio:
```tsx
// components/LeaveRequestCard/LeaveRequestCard.tsx
import React from 'react';
import styles from './LeaveRequestCard.module.css';
import { LeaveRequest } from '../../types';

interface LeaveRequestCardProps {
  leaveRequest: LeaveRequest;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  leaveRequest,
  onApprove,
  onReject
}) => {
  return (
    <div className={styles.card}>
      <h3>{leaveRequest.leave_type.name}</h3>
      <p>
        {new Date(leaveRequest.start_date).toLocaleDateString()} - 
        {new Date(leaveRequest.end_date).toLocaleDateString()}
      </p>
      <div className={styles.status}>
        Status: <span className={styles[leaveRequest.status]}>{leaveRequest.status}</span>
      </div>
      {leaveRequest.status === 'pending' && (
        <div className={styles.actions}>
          {onApprove && (
            <button onClick={() => onApprove(leaveRequest.id)}>Approve</button>
          )}
          {onReject && (
            <button onClick={() => onReject(leaveRequest.id)}>Reject</button>
          )}
        </div>
      )}
    </div>
  );
};
```

## Architettura API

### Endpoints RESTful

- Segui le convenzioni REST per nomi e metodi
- Implementa versioning delle API
- Usa plurali per le collezioni
- Supporta filtri, ordinamento e paginazione

### Autenticazione e Sicurezza

- Usa JWT per l'autenticazione
- Implementa refresh token per sessioni persistenti
- Applica permessi basati su ruoli
- Valida tutti gli input sia client che server

### Pattern di risposta

Mantieni consistente la struttura delle risposte:

```json
{
  "status": "success",
  "data": { ... }
}
```

o in caso di errori:

```json
{
  "status": "error",
  "message": "Descrizione dell'errore",
  "code": "ERROR_CODE"
}
```

## Testing

### Backend

- Scrivi test per ogni model, view e serializer
- Usa pytest come framework di testing
- Utilizza factory_boy per creare oggetti di test
- Implementa coverage report

Esempio:
```python
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.leaves.models import LeaveRequest, LeaveType
from tests.factories import UserFactory, LeaveTypeFactory, LeaveRequestFactory

@pytest.mark.django_db
class TestLeaveRequestAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.leave_type = LeaveTypeFactory()
        
    def test_create_leave_request(self):
        url = reverse('leaverequest-list')
        data = {
            'leave_type_id': self.leave_type.id,
            'start_date': '2025-08-01',
            'end_date': '2025-08-15',
            'reason': 'Test leave request',
        }
        
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert LeaveRequest.objects.count() == 1
        assert LeaveRequest.objects.get().reason == 'Test leave request'
```

###