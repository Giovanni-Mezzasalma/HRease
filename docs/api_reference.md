# Riferimento API di HRease

## Introduzione

Questa documentazione descrive le API REST di HRease, accessibili tramite endpoint HTTP. Le API seguono i principi REST e utilizzano JWT per l'autenticazione.

**Base URL**: `http://localhost:8000/api/` (sviluppo locale)

**Autenticazione**: Tutte le richieste API (eccetto login/registrazione) richiedono un header `Authorization` con un token JWT valido:

```
Authorization: Bearer <token>
```

## Versioning

Le API sono attualmente alla versione 1, accessibili tramite il prefisso `/api/v1/`.

## Formati di Risposta

Le risposte API sono in formato JSON, con struttura consistente:

**Successo**:
```json
{
  "status": "success",
  "data": { ... }
}
```

**Errore**:
```json
{
  "status": "error",
  "message": "Descrizione errore",
  "code": "ERROR_CODE"
}
```

## Endpoints Autenticazione

### Login

**Endpoint**: `POST /api/v1/auth/login/`

**Descrizione**: Autentica un utente e restituisce i token di accesso e refresh.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access": "eyJ0eXAiOiJKV...",
    "refresh": "eyJ0eXAiOiJKV...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Nome",
      "last_name": "Cognome"
    }
  }
}
```

### Refresh Token

**Endpoint**: `POST /api/v1/auth/refresh/`

**Descrizione**: Rinnova il token di accesso usando un token di refresh valido.

**Request Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV..."
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access": "eyJ0eXAiOiJKV..."
  }
}
```

### Verifica Token

**Endpoint**: `POST /api/v1/auth/verify/`

**Descrizione**: Verifica la validità di un token di accesso.

**Request Body**:
```json
{
  "token": "eyJ0eXAiOiJKV..."
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success"
}
```

## Endpoints Utenti

### Profilo Utente

**Endpoint**: `GET /api/v1/users/me/`

**Descrizione**: Ottiene il profilo dell'utente corrente.

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Nome",
    "last_name": "Cognome",
    "job_title": "Developer",
    "department": "IT",
    "hire_date": "2022-01-15"
  }
}
```

### Aggiornamento Profilo

**Endpoint**: `PATCH /api/v1/users/me/`

**Descrizione**: Aggiorna il profilo dell'utente corrente.

**Request Body** (campi opzionali):
```json
{
  "first_name": "Nuovo Nome",
  "job_title": "Senior Developer"
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Nuovo Nome",
    "last_name": "Cognome",
    "job_title": "Senior Developer",
    "department": "IT",
    "hire_date": "2022-01-15"
  }
}
```

## Endpoints Leave Requests

### Lista Richieste

**Endpoint**: `GET /api/v1/leaves/`

**Descrizione**: Ottiene la lista delle richieste di assenza dell'utente.

**Parametri Query**:
- `status`: filtra per stato (es. pending, approved, rejected)
- `start_date`: filtra per data di inizio (formato YYYY-MM-DD)
- `end_date`: filtra per data di fine (formato YYYY-MM-DD)

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "leave_type": {
          "id": 1,
          "name": "Ferie",
          "color_code": "#3498db"
        },
        "start_date": "2025-08-01",
        "end_date": "2025-08-15",
        "status": "approved",
        "created_at": "2025-06-15T10:30:00Z"
      },
      {
        "id": 2,
        "leave_type": {
          "id": 2,
          "name": "Malattia",
          "color_code": "#e74c3c"
        },
        "start_date": "2025-07-10",
        "end_date": "2025-07-12",
        "status": "approved",
        "created_at": "2025-07-10T08:00:00Z"
      }
    ]
  }
}
```

### Dettaglio Richiesta

**Endpoint**: `GET /api/v1/leaves/{id}/`

**Descrizione**: Ottiene i dettagli di una specifica richiesta di assenza.

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Nome",
      "last_name": "Cognome"
    },
    "leave_type": {
      "id": 1,
      "name": "Ferie",
      "is_paid": true,
      "color_code": "#3498db"
    },
    "start_date": "2025-08-01",
    "end_date": "2025-08-15",
    "half_day": false,
    "reason": "Vacanza estiva",
    "status": "approved",
    "created_at": "2025-06-15T10:30:00Z",
    "updated_at": "2025-06-16T14:20:00Z",
    "approved_by": {
      "id": 2,
      "email": "manager@example.com",
      "first_name": "Manager",
      "last_name": "Example"
    },
    "approval_date": "2025-06-16T14:20:00Z",
    "duration": 15
  }
}
```

### Creazione Richiesta

**Endpoint**: `POST /api/v1/leaves/`

**Descrizione**: Crea una nuova richiesta di assenza.

**Request Body**:
```json
{
  "leave_type_id": 1,
  "start_date": "2025-09-10",
  "end_date": "2025-09-15",
  "half_day": false,
  "reason": "Vacanza settembre"
}
```

**Risposta di Successo** (201 Created):
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "leave_type": {
      "id": 1,
      "name": "Ferie",
      "color_code": "#3498db"
    },
    "start_date": "2025-09-10",
    "end_date": "2025-09-15",
    "half_day": false,
    "reason": "Vacanza settembre",
    "status": "pending",
    "created_at": "2025-07-20T15:45:00Z"
  }
}
```

### Aggiornamento Richiesta

**Endpoint**: `PATCH /api/v1/leaves/{id}/`

**Descrizione**: Aggiorna una richiesta di assenza esistente (solo se in stato "pending").

**Request Body** (campi opzionali):
```json
{
  "end_date": "2025-09-17",
  "reason": "Vacanza settembre estesa"
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "leave_type": {
      "id": 1,
      "name": "Ferie",
      "color_code": "#3498db"
    },
    "start_date": "2025-09-10",
    "end_date": "2025-09-17",
    "half_day": false,
    "reason": "Vacanza settembre estesa",
    "status": "pending",
    "created_at": "2025-07-20T15:45:00Z",
    "updated_at": "2025-07-20T16:00:00Z"
  }
}
```

### Cancellazione Richiesta

**Endpoint**: `DELETE /api/v1/leaves/{id}/`

**Descrizione**: Cancella una richiesta di assenza (solo se in stato "pending").

**Risposta di Successo** (204 No Content)

### Approvazione/Rifiuto Richiesta (solo admin/manager)

**Endpoint**: `POST /api/v1/leaves/{id}/approve/` o `/api/v1/leaves/{id}/reject/`

**Descrizione**: Approva o rifiuta una richiesta di assenza.

**Request Body** (opzionale):
```json
{
  "comment": "Approvato, buone vacanze!"
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "status": "approved",
    "approved_by": {
      "id": 2,
      "email": "manager@example.com"
    },
    "approval_date": "2025-07-21T09:30:00Z"
  }
}
```

## Tipi di Assenza

### Lista Tipi di Assenza

**Endpoint**: `GET /api/v1/leave-types/`

**Descrizione**: Ottiene la lista dei tipi di assenza disponibili.

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Ferie",
      "description": "Ferie annuali",
      "is_paid": true,
      "color_code": "#3498db"
    },
    {
      "id": 2,
      "name": "Malattia",
      "description": "Assenza per malattia",
      "is_paid": true,
      "color_code": "#e74c3c"
    },
    {
      "id": 3,
      "name": "Permesso",
      "description": "Permesso breve",
      "is_paid": true,
      "color_code": "#2ecc71"
    }
  ]
}
```

## Festività

### Lista Festività

**Endpoint**: `GET /api/v1/holidays/`

**Descrizione**: Ottiene la lista delle festività per l'anno corrente.

**Parametri Query**:
- `year`: Anno per cui recuperare le festività (default: anno corrente)

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Capodanno",
      "date": "2025-01-01",
      "is_recurring": true
    },
    {
      "id": 2,
      "name": "Festa della Liberazione",
      "date": "2025-04-25",
      "is_recurring": true
    }
  ]
}
```

## Paginazione

Le API che restituiscono liste supportano la paginazione con i seguenti parametri:

- `page`: Numero di pagina (default: 1)
- `page_size`: Dimensione della pagina (default: 10, max: 100)

Esempio: `GET /api/v1/leaves/?page=2&page_size=20`

## Codici di Errore

- `AUTHENTICATION_FAILED`: Autenticazione fallita
- `INVALID_TOKEN`: Token non valido o scaduto
- `PERMISSION_DENIED`: Permessi insufficienti
- `RESOURCE_NOT_FOUND`: Risorsa non trovata
- `VALIDATION_ERROR`: Errore di validazione
- `LEAVE_REQUEST_CONFLICT`: Conflitto con altre richieste di assenza

## Considerazioni sulla Sicurezza

- Utilizzo di HTTPS in produzione
- Rate limiting per prevenire abusi
- Validazione dei dati di input
- Autorizzazioni basate su ruoli

## Usi dell'API nei Client

### Esempio di Autenticazione (JavaScript/React)

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      // Salva i token in localStorage o state management
      localStorage.setItem('accessToken', data.data.access);
      localStorage.setItem('refreshToken', data.data.refresh);
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Esempio di Chiamata API Autenticata (JavaScript/React)

```javascript
const fetchLeaveRequests = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:8000/api/v1/leaves/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.data.results;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to fetch leave requests:', error);
    throw error;
  }
};
```

# API Microservizio di Logging

## Introduzione

Il microservizio di logging offre API RESTful che consentono l'invio, la ricerca e l'analisi dei log. Questa documentazione illustra gli endpoint disponibili e come utilizzarli.

**Base URL**: `http://logging-service:8080/api/v1/` (sviluppo locale)

**Autenticazione**: Tutte le richieste richiedono un header `X-API-Key` con una chiave API valida:

```
X-API-Key: <api_key>
```

## Formati di Risposta

Le risposte API sono in formato JSON, con struttura consistente:

**Successo**:
```json
{
  "status": "success",
  "data": { ... }
}
```

**Errore**:
```json
{
  "status": "error",
  "message": "Descrizione errore",
  "code": "ERROR_CODE"
}
```

## Endpoints di Ingestione Log

### Invio Singolo Log

**Endpoint**: `POST /logs`

**Descrizione**: Invia un singolo record di log al servizio.

**Request Body**:
```json
{
  "timestamp": "2025-03-20T14:30:00.000Z",
  "service": "django-backend",
  "level": "info",
  "message": "User login successful",
  "context": {
    "user_id": 42,
    "ip_address": "192.168.1.1"
  }
}
```

**Risposta di Successo** (201 Created):
```json
{
  "status": "success",
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}
```

### Invio Batch di Log

**Endpoint**: `POST /logs/batch`

**Descrizione**: Invia più record di log in una singola richiesta.

**Request Body**:
```json
{
  "service": "react-frontend",
  "logs": [
    {
      "timestamp": "2025-03-20T14:30:00.000Z",
      "level": "info",
      "message": "Page loaded",
      "context": {
        "url": "/dashboard",
        "loadTime": 1.2
      }
    },
    {
      "timestamp": "2025-03-20T14:30:05.000Z",
      "level": "error",
      "message": "API request failed",
      "context": {
        "url": "/api/v1/users",
        "status": 500
      }
    }
  ]
}
```

**Risposta di Successo** (201 Created):
```json
{
  "status": "success",
  "data": {
    "processed": 2,
    "failed": 0,
    "ids": [
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "a97ac10b-58cc-4372-b567-0e02b2c3d123"
    ]
  }
}
```

## Endpoints di Ricerca e Analisi

### Ricerca Log

**Endpoint**: `POST /logs/search`

**Descrizione**: Cerca log basati su criteri specifici.

**Request Body**:
```json
{
  "timeRange": {
    "from": "2025-03-19T00:00:00.000Z",
    "to": "2025-03-20T23:59:59.999Z"
  },
  "filters": [
    {
      "field": "level",
      "operator": "eq",
      "value": "error"
    },
    {
      "field": "service",
      "operator": "eq",
      "value": "django-backend"
    }
  ],
  "query": "login",
  "size": 50,
  "from": 0,
  "sort": [
    {
      "field": "timestamp",
      "order": "desc"
    }
  ]
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "total": 120,
    "logs": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "timestamp": "2025-03-20T14:30:00.000Z",
        "service": "django-backend",
        "level": "error",
        "message": "Login failed: invalid credentials",
        "context": {
          "user_email": "user@example.com",
          "ip_address": "192.168.1.1"
        }
      },
      // ... altri log
    ]
  }
}
```

### Analisi Aggregata

**Endpoint**: `POST /logs/analyze`

**Descrizione**: Esegue analisi aggregate sui log.

**Request Body**:
```json
{
  "timeRange": {
    "from": "2025-03-19T00:00:00.000Z",
    "to": "2025-03-20T23:59:59.999Z"
  },
  "filters": [
    {
      "field": "service",
      "operator": "eq",
      "value": "django-backend"
    }
  ],
  "aggregations": [
    {
      "type": "terms",
      "field": "level",
      "size": 5
    },
    {
      "type": "date_histogram",
      "field": "timestamp",
      "interval": "1h"
    }
  ]
}
```

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "aggregations": {
      "level": {
        "buckets": [
          {
            "key": "info",
            "doc_count": 5243
          },
          {
            "key": "error",
            "doc_count": 127
          },
          {
            "key": "warn",
            "doc_count": 89
          },
          {
            "key": "debug",
            "doc_count": 45
          }
        ]
      },
      "timestamp": {
        "buckets": [
          {
            "key_as_string": "2025-03-19T00:00:00.000Z",
            "key": 1742572800000,
            "doc_count": 120
          },
          // ... altri bucket
        ]
      }
    }
  }
}
```

## Endpoints di Configurazione Alert

### Creazione Alert

**Endpoint**: `POST /alerts`

**Descrizione**: Crea una nuova regola di alert basata sui log.

**Request Body**:
```json
{
  "name": "High Error Rate Alert",
  "description": "Alert when error rate is too high",
  "query": {
    "timeRange": {
      "from": "now-1h",
      "to": "now"
    },
    "filters": [
      {
        "field": "level",
        "operator": "eq",
        "value": "error"
      },
      {
        "field": "service",
        "operator": "eq",
        "value": "django-backend"
      }
    ]
  },
  "conditions": {
    "count": {
      "gt": 10
    }
  },
  "actions": [
    {
      "type": "email",
      "recipients": ["admin@example.com"],
      "subject": "High Error Rate Alert",
      "message": "There are {{count}} errors in the last hour."
    }
  ],
  "throttle": "10m",
  "enabled": true
}
```

**Risposta di Successo** (201 Created):
```json
{
  "status": "success",
  "data": {
    "id": "a87bc10b-58cc-4372-a567-0e02b2c3d123",
    "created_at": "2025-03-20T15:00:00.000Z"
  }
}
```

### Lista Alert

**Endpoint**: `GET /alerts`

**Descrizione**: Ottiene la lista delle regole di alert configurate.

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "id": "a87bc10b-58cc-4372-a567-0e02b2c3d123",
        "name": "High Error Rate Alert",
        "description": "Alert when error rate is too high",
        "enabled": true,
        "created_at": "2025-03-20T15:00:00.000Z",
        "updated_at": "2025-03-20T15:00:00.000Z"
      },
      // ... altri alert
    ]
  }
}
```

## Endpoints di Monitoraggio

### Stato del Servizio

**Endpoint**: `GET /status`

**Descrizione**: Fornisce lo stato attuale del microservizio di logging.

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "version": "1.0.0",
    "uptime": 3600,
    "components": {
      "api": "healthy",
      "elasticsearch": "healthy",
      "redis": "healthy"
    },
    "stats": {
      "logs_processed_last_hour": 12500,
      "logs_processed_last_day": 256000,
      "active_alerts": 5
    }
  }
}
```

### Metriche del Servizio

**Endpoint**: `GET /metrics`

**Descrizione**: Fornisce metriche dettagliate sulle performance del servizio.

**Risposta di Successo** (200 OK):
```json
{
  "status": "success",
  "data": {
    "queue": {
      "length": 15,
      "processing_rate": 250
    },
    "api": {
      "requests_total": 15000,
      "requests_per_minute": 45,
      "response_time_avg_ms": 120
    },
    "storage": {
      "logs_total": 1500000,
      "storage_size_gb": 2.5,
      "indices": 7
    }
  }
}
```

## Codici di Errore

- `AUTHENTICATION_FAILED`: Chiave API non valida
- `VALIDATION_ERROR`: Dati di richiesta non validi
- `RATE_LIMIT_EXCEEDED`: Limite di rate superato
- `SERVICE_UNAVAILABLE`: Servizio temporaneamente non disponibile
- `INTERNAL_ERROR`: Errore interno del server
- `QUERY_ERROR`: Errore nella query di ricerca

## Considerazioni sulla Sicurezza

- Tutte le richieste devono utilizzare HTTPS in produzione
- Le chiavi API devono essere mantenute segrete e ruotate periodicamente
- Il rate limiting previene abusi degli endpoint
- La validazione rigorosa dei dati in input protegge il servizio

## Client SDK

Per semplificare l'integrazione con il microservizio di logging, sono disponibili SDK per i seguenti linguaggi:

### JavaScript/TypeScript

```javascript
import { LoggingClient } from 'hrease-logging-client';

const client = new LoggingClient({
  apiUrl: 'https://logging-service.example.com/api/v1',
  apiKey: 'your-api-key',
  service: 'frontend-app',
  batchSize: 50,
  flushInterval: 5000
});

// Invia un log
client.info('User clicked button', { 
  userId: 123, 
  buttonId: 'submit-form' 
});

// Cerca nei log
const logs = await client.search({
  timeRange: { from: '2025-03-19', to: '2025-03-20' },
  filters: [{ field: 'level', operator: 'eq', value: 'error' }],
  size: 50
});
```

### Python

```python
from hrease_logging_client import LoggingClient

client = LoggingClient(
    api_url='https://logging-service.example.com/api/v1',
    api_key='your-api-key',
    service='django-backend',
    batch_size=50,
    flush_interval=5.0
)

# Invia un log
client.info('User authenticated', {
    'user_id': 123,
    'ip_address': '192.168.1.1'
})

# Cerca nei log
logs = client.search(
    time_range={'from': '2025-03-19', 'to': '2025-03-20'},
    filters=[{'field': 'level', 'operator': 'eq', 'value': 'error'}],
    size=50
)
```

## Considerazioni Implementative

Quando si interagisce con il microservizio di logging, considerate:

1. **Buffering e Batching**: Utilizzate l'invio in batch per ottimizzare le performance
2. **Struttura dei Log**: Standardizzate la struttura dei log attraverso i vari servizi
3. **Rate Limiting**: Implementate retry con backoff esponenziale in caso di errori 429
4. **Contesto Arricchito**: Aggiungete sempre contesto utile ai log per facilitare l'analisi
5. **Sensibilità dei Dati**: Non includete dati sensibili nei log (password, token, ecc.)

## Demo e Esempi

Per esempi completi di integrazione e utilizzo, consultate:

- [Esempio di integrazione Django](../examples/logging-django-integration.py)
- [Esempio di integrazione React](../examples/logging-react-integration.ts)
- [Esempio di dashboard personalizzata](../examples/logging-custom-dashboard.js)

## Considerazioni future

Con l'evoluzione della piattaforma, saranno aggiunti ulteriori endpoint per supportare:

- Gestione reperibilità
- Smart working
- Timesheet
- Dashboard e report