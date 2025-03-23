# Guida Rapida Comandi Docker per HRease

Questa guida contiene i comandi Docker e Docker Compose più utili per lavorare con il progetto HRease.

## Comandi Docker Compose di Base

| Comando | Descrizione |
|---------|-------------|
| `docker-compose up -d` | Avvia tutti i container in modalità detached (background) |
| `docker-compose start` | Avvia container già creati ma fermi |
| `docker-compose stop` | Ferma i container senza rimuoverli |
| `docker-compose down` | Ferma e rimuove i container e le reti create |
| `docker-compose down -v` | Ferma e rimuove i container, le reti e i volumi (⚠️ elimina i dati) |
| `docker-compose down -v --rmi all --remove-orphans` | Rimuove tutto: container, reti, volumi e immagini (⚠️ pulizia completa) |
| `docker-compose restart` | Riavvia tutti i container |
| `docker-compose logs` | Visualizza i log di tutti i container |
| `docker-compose logs -f` | Visualizza i log in tempo reale (follow) |
| `docker-compose ps` | Mostra lo stato di tutti i container |

## Gestione dei Container Specifici

| Comando | Descrizione |
|---------|-------------|
| `docker-compose up -d backend` | Avvia solo il container backend |
| `docker-compose up -d frontend` | Avvia solo il container frontend |
| `docker-compose stop backend` | Ferma solo il container backend |
| `docker-compose stop frontend` | Ferma solo il container frontend |
| `docker-compose restart backend` | Riavvia solo il container backend |
| `docker-compose logs backend` | Visualizza i log del container backend |
| `docker-compose logs -f frontend` | Visualizza i log in tempo reale del frontend |

## Esecuzione Comandi nei Container

| Comando | Descrizione |
|---------|-------------|
| `docker-compose exec backend python manage.py migrate` | Esegue le migrazioni Django |
| `docker-compose exec backend python manage.py createsuperuser` | Crea un superuser Django |
| `docker-compose exec backend python manage.py shell` | Apre la shell Django |
| `docker-compose exec backend pytest` | Esegue i test backend |
| `docker-compose exec frontend npm test` | Esegue i test frontend |
| `docker-compose exec backend python manage.py makemigrations` | Crea nuove migrazioni |
| `docker-compose exec db psql -U postgres -d hrease_db` | Accede alla shell PostgreSQL |

## Gestione Database

| Comando | Descrizione |
|---------|-------------|
| `docker-compose exec db pg_dump -U postgres hrease_db > backup.sql` | Esporta backup database |
| `cat backup.sql | docker-compose exec -T db psql -U postgres -d hrease_db` | Importa backup |
| `docker-compose down -v && docker-compose up -d db` | Reset database (⚠️ cancella tutti i dati) |

## Gestione Build e Immagini

| Comando | Descrizione |
|---------|-------------|
| `docker-compose build` | Ricompila tutte le immagini |
| `docker-compose build backend` | Ricompila solo l'immagine backend |
| `docker-compose build --no-cache` | Ricompila senza usare la cache |
| `docker-compose pull` | Aggiorna le immagini remote |

## Pulizia Completa del Sistema Docker

| Comando | Descrizione |
|---------|-------------|
| `docker stop $(docker ps -aq)` | Ferma tutti i container in esecuzione |
| `docker rm $(docker ps -aq)` | Rimuove tutti i container |
| `docker volume prune -f` | Rimuove tutti i volumi non utilizzati (⚠️ elimina dati) |
| `docker rmi $(docker images -q) -f` | Rimuove tutte le immagini Docker |
| `docker network prune -f` | Rimuove tutte le reti non utilizzate |
| `docker system prune -a -f --volumes` | Pulizia completa del sistema (⚠️ rimuove tutto) |

## Comandi Utili per Debugging

| Comando | Descrizione |
|---------|-------------|
| `docker-compose config` | Verifica la configurazione e la risolve |
| `docker-compose top` | Mostra i processi in esecuzione |
| `docker-compose exec backend ls -la` | Lista file nel container |
| `docker-compose run --rm backend python manage.py check` | Verifica problemi nell'app Django |
| `docker stats` | Mostra uso CPU/memoria dei container |

## Esempi Scenari Comuni

### Riavvio Completo dell'Ambiente
```bash
docker-compose down
docker-compose up -d
```

### Aggiornamento del Codice dopo Pull da Git
```bash
git pull
docker-compose build  # Solo se Dockerfile è cambiato
docker-compose up -d --force-recreate
```

### Reset Completo (⚠️ elimina tutti i dati)
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Reset Totale e Pulizia (⚠️ elimina tutto)
```bash
# Rimuove tutti i container, volumi e immagini del progetto
docker-compose down -v --rmi all --remove-orphans

# Per ripartire da zero
docker-compose up -d
```

### Applicare Modifiche alle Dipendenze
Dopo aver modificato requirements.txt o package.json:
```bash
# Per backend
docker-compose build backend
docker-compose up -d --no-deps backend

# Per frontend
docker-compose build frontend
docker-compose up -d --no-deps frontend
```

## Analisi dei Logs

Per analizzare i log quando si verificano problemi:

```bash
# Tutti i log recenti
docker-compose logs --tail=100

# Log in tempo reale filtrati
docker-compose logs -f | grep -i error

# Salva i log in un file
docker-compose logs > app_logs.txt
```

## Comandi Sicurezza Volumi Docker

| Comando | Descrizione |
|---------|-------------|
| `docker volume ls` | Elenco di tutti i volumi |
| `docker volume inspect postgres_data` | Dettagli volume del database |
| `docker volume prune` | Rimuove volumi non utilizzati (⚠️ usare con cautela) |

# Comandi Docker per il Microservizio di Logging

Questa sezione contiene i comandi Docker specifici per gestire il microservizio di logging nell'ecosistema HRease.

## Gestione del Microservizio di Logging

| Comando | Descrizione |
|---------|-------------|
| `docker-compose up -d logging-service` | Avvia solo il container del microservizio di logging |
| `docker-compose up -d elasticsearch kibana` | Avvia i componenti di storage e visualizzazione log |
| `docker-compose up -d logging-stack` | Avvia tutti i servizi correlati al logging (usando il service profile) |
| `docker-compose logs -f logging-service` | Visualizza i log del microservizio di logging in tempo reale |
| `docker-compose restart logging-service` | Riavvia il servizio di logging |
| `docker-compose exec logging-service npm run flush-logs` | Forza l'invio di tutti i log in buffer |

## Comandi Elasticsearch e Kibana

| Comando | Descrizione |
|---------|-------------|
| `docker-compose exec elasticsearch elasticsearch-reset-password -u elastic` | Reimposta la password utente elastic |
| `docker-compose exec elasticsearch bin/elasticsearch-plugin list` | Lista plugin installati |
| `docker-compose exec kibana bin/kibana-plugin list` | Lista plugin Kibana installati |
| `docker-compose exec elasticsearch curl -X GET "localhost:9200/_cat/indices?v"` | Elenca tutti gli indici Elasticsearch |
| `docker-compose exec elasticsearch curl -X DELETE "localhost:9200/logs-*"` | ⚠️ Elimina tutti gli indici dei log |

## Backup e Manutenzione

| Comando | Descrizione |
|---------|-------------|
| `docker-compose exec elasticsearch curl -X PUT "localhost:9200/_snapshot/backup_repository"` | Crea repository per snapshot |
| `docker-compose exec elasticsearch curl -X PUT "localhost:9200/_snapshot/backup_repository/snapshot_1?wait_for_completion=true"` | Crea snapshot dei dati |
| `docker-compose exec elasticsearch curl -X GET "localhost:9200/_snapshot/backup_repository/snapshot_1"` | Ottiene info su snapshot |
| `docker-compose exec elasticsearch curl -X POST "localhost:9200/_snapshot/backup_repository/snapshot_1/_restore"` | Ripristina da snapshot |
| `docker-compose exec minio mc ls /data/backups` | Lista backup in MinIO |

## Debugging e Troubleshooting

| Comando | Descrizione |
|---------|-------------|
| `docker-compose logs -f --tail=100 logging-service elasticsearch kibana` | Visualizza gli ultimi 100 log dell'intera stack |
| `docker-compose exec logging-service node inspect src/scripts/analyze-indices.js` | Esegue script di debug con inspector |
| `docker-compose exec logging-service curl -X GET http://elasticsearch:9200/_cluster/health` | Verifica salute del cluster Elasticsearch |
| `docker-compose exec kibana curl -X GET http://localhost:5601/api/status` | Verifica stato di Kibana |
| `docker-compose exec logging-service pm2 status` | Verifica stato dei processi (se usa PM2) |

## Gestione Indici e Rotazione

| Comando | Descrizione |
|---------|-------------|
| `docker-compose exec elasticsearch curl -X POST "localhost:9200/logs-*/_forcemerge?max_num_segments=1"` | Forza merge degli indici dei log |
| `docker-compose exec logging-service npm run rotate-indices` | Esegue rotazione manuale degli indici |
| `docker-compose exec elasticsearch curl -X GET "localhost:9200/_ilm/policy"` | Visualizza policy di gestione ciclo vita indici |
| `docker-compose exec logging-service npm run cleanup-old-logs` | Pulisce log storici secondo policy di retention |

## Monitoraggio e Prestazioni

| Comando | Descrizione |
|---------|-------------|
| `docker stats logging-service elasticsearch kibana` | Monitora uso CPU/memoria in tempo reale |
| `docker-compose exec elasticsearch curl -X GET "localhost:9200/_nodes/stats"` | Ottiene statistiche nodi Elasticsearch |
| `docker-compose exec logging-service npm run generate-metrics-report` | Genera report sulle metriche di performance |
| `docker-compose exec logging-service npm run test-throughput` | Esegue test di throughput |
| `docker-compose exec logging-service curl -X GET "http://localhost:8080/api/v1/metrics"` | Ottiene metriche interne del servizio |

## Reset Completo del Sistema di Logging

⚠️ **Attenzione: Questi comandi causano perdita di dati. Usare solo in ambienti di sviluppo o quando necessario.**

```bash
# Ferma servizi di logging
docker-compose stop logging-service elasticsearch kibana redis minio

# Rimuovi container
docker-compose rm -f logging-service elasticsearch kibana redis minio

# Pulisci volumi (⚠️ elimina tutti i dati)
docker volume rm hrease_elasticsearch-data hrease_redis-data hrease_minio-data

# Riavvia i servizi con configurazione pulita
docker-compose up -d logging-service elasticsearch kibana redis minio
```

## Esempi di Scenari Comuni

### Aggiornamento del Microservizio di Logging

```bash
# Pull dell'ultima versione dal repository
git pull

# Ricostruisci l'immagine
docker-compose build logging-service

# Riavvia il servizio con la nuova immagine
docker-compose up -d --no-deps logging-service
```

### Configurazione Elasticsearch per Ambienti con Risorse Limitate

```bash
# Modifica configurazione Elasticsearch
cat << EOF > elasticsearch.yml
http.host: 0.0.0.0
transport.host: 0.0.0.0
network.host: 0.0.0.0
cluster.name: hrease-logging
bootstrap.memory_lock: true
discovery.type: single-node
xpack.security.enabled: true
xpack.license.self_generated.type: basic
xpack.monitoring.collection.enabled: true
# Configurazione per risorse limitate
cluster.routing.allocation.disk.threshold_enabled: true
cluster.routing.allocation.disk.watermark.low: 93%
cluster.routing.allocation.disk.watermark.high: 95%
indices.memory.index_buffer_size: 10%
indices.fielddata.cache.size: 15%
indices.queries.cache.size: 5%
EOF

# Applica configurazione
docker-compose restart elasticsearch
```

### Ripristino Emergency di Elasticsearch

```bash
# Ferma Elasticsearch
docker-compose stop elasticsearch

# Backup della configurazione corrente
docker cp hrease-elasticsearch-1:/usr/share/elasticsearch/config ./es-config-backup

# Avvia in modalità emergency
docker-compose run --rm elasticsearch elasticsearch -E path.data=/tmp/es-data -E path.logs=/tmp/es-logs -E xpack.security.enabled=false

# Verifica dello stato
docker-compose run --rm elasticsearch curl -X GET http://localhost:9200/_cluster/health

# Ripristina configurazione e riavvia normalmente
docker-compose up -d elasticsearch
```

### Integrare Log da Servizi di Terze Parti

```bash
# Configura Filebeat per raccogliere log da servizi esterni
cat << EOF > filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/external-service/*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  username: "elastic"
  password: "changeme"
  index: "external-logs-%{+yyyy.MM.dd}"
EOF

# Avvia Filebeat come container aggiuntivo
docker run -d \
  --name filebeat \
  --network hrease_logging-network \
  -v $(pwd)/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro \
  -v /var/log/external-service:/var/log/external-service:ro \
  docker.elastic.co/beats/filebeat:7.17.0
```

### Generazione Rapporto Stato del Sistema di Logging

```bash
#!/bin/bash
# Salva in un file chiamato logging-status-report.sh

echo "=== Rapporto Stato Sistema di Logging HRease $(date) ==="
echo ""

echo "== Status Container =="
docker-compose ps logging-service elasticsearch kibana redis minio
echo ""

echo "== Status Elasticsearch =="
docker-compose exec -T elasticsearch curl -s -X GET "localhost:9200/_cluster/health?pretty"
echo ""

echo "== Indici Elasticsearch =="
docker-compose exec -T elasticsearch curl -s -X GET "localhost:9200/_cat/indices?v"
echo ""

echo "== Spazio Disco =="
docker-compose exec -T elasticsearch curl -s -X GET "localhost:9200/_cat/allocation?v"
echo ""

echo "== Metriche Microservizio Log =="
docker-compose exec -T logging-service curl -s -X GET "http://localhost:8080/api/v1/metrics"
echo ""

echo "== Log Recenti =="
docker-compose logs --tail=20 logging-service
echo ""

echo "== Fine Rapporto =="
```

## Note

- I comandi che mostrano l'avviso ⚠️ possono causare perdita di dati
- In produzione, backup regolari del database sono essenziali
- Le modifiche al Dockerfile o docker-compose.yml richiedono ricompilazione

Questo documento è pensato come riferimento rapido. Per dettagli completi, consultare la [documentazione ufficiale di Docker](https://docs.docker.com/) e [Docker Compose](https://docs.docker.com/compose/).