# backend/apps/core/logging.py
"""
Handler di logging personalizzato per inviare log al microservizio di logging.

Questo modulo definisce un handler che può essere usato con il sistema di logging
standard di Python/Django per inviare log al microservizio di logging centralizzato.
"""

import logging
import requests
import threading
import json
from datetime import datetime
from django.conf import settings

class SimpleLogHandler(logging.Handler):
    """
    Handler di logging che invia log al microservizio di logging via HTTP.
    
    Invia i log in modo asincrono tramite thread separati per evitare di
    bloccare l'applicazione principale durante l'invio.
    """
    
    def __init__(self, *args, **kwargs):
        """
        Inizializza l'handler con le configurazioni dal settings.py.
        
        Args:
            *args: Argomenti posizionali per la classe base Handler
            **kwargs: Argomenti keyword per la classe base Handler
        """
        super().__init__(*args, **kwargs)
        # Ottieni l'URL del servizio di logging dalle impostazioni
        self.service_url = getattr(settings, 'LOGGING_SERVICE_URL', 'http://logging-service:8080')
        # Stampa l'URL del servizio per aiutare nella configurazione
        print(f"SimpleLogHandler initialized with service URL: {self.service_url}")
    
    def emit(self, record):
        """
        Invia un record di log al microservizio.
        
        Si occupa di formattare il record, preparare i dati e
        avviare un thread separato per l'invio asincrono.
        
        Args:
            record: LogRecord da inviare
        """
        try:
            # Formatta il messaggio di log usando il formatter configurato
            log_entry = self.format(record)
            
            # Estrai eventuali dati extra dal record
            extra_data = {}
            for key, value in record.__dict__.items():
                if key not in logging.LogRecord('', 0, '', 0, '', (), None).__dict__:
                    # Tenta di serializzare in JSON, altrimenti usa str()
                    try:
                        if isinstance(value, (dict, list, tuple, str, int, float, bool, type(None))):
                            extra_data[key] = value
                        else:
                            extra_data[key] = str(value)
                    except Exception:
                        extra_data[key] = str(value)
            
            # Prepara i dati per l'invio
            log_data = {
                'source': 'backend',
                'level': record.levelname.lower(),
                'message': log_entry,
                'timestamp': datetime.utcnow().isoformat(),
                'meta': {
                    'module': record.module,
                    'function': record.funcName,
                    'line': record.lineno,
                    'process_id': record.process,
                    'thread_id': record.thread,
                    **extra_data  # Includi tutti i dati extra dal record
                }
            }
            
            # Invia in modo asincrono per non bloccare l'applicazione
            threading.Thread(
                target=self._send_log,
                args=(log_data,),
                daemon=True
            ).start()
            
        except Exception as e:
            # In caso di errore, usa il metodo handleError della classe base
            print(f"Error in SimpleLogHandler.emit: {e}")
            self.handleError(record)
    
    def _send_log(self, log_data):
        """
        Invia effettivamente il log al microservizio.
        
        Metodo destinato a essere eseguito in un thread separato.
        
        Args:
            log_data: Dati del log da inviare
        """
        try:
            # Timeout breve per evitare blocchi
            response = requests.post(
                f"{self.service_url}/api/logs",
                json=log_data,
                timeout=1
            )
            
            # Log di debug (stampato solo nella console)
            if response.status_code != 201:
                print(f"Failed to send log to service. Status: {response.status_code}, Response: {response.text}")
                
        except requests.RequestException as e:
            # Ignora errori di rete per evitare che problemi nel servizio di logging
            # causino problemi nell'applicazione principale
            print(f"Error sending log to service: {e}")
        except Exception as e:
            print(f"Unexpected error in log handler: {e}")
