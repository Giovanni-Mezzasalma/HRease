# backend/apps/core/views.py

import logging
from django.http import JsonResponse
from django.views.decorators.http import require_GET

# Ottieni un'istanza del logger
logger = logging.getLogger(__name__)

@require_GET
def test_logging(request):
    """
    View di test per verificare l'integrazione con il microservizio di logging.
    
    Questa view genera log di diversi livelli per verificare che vengano correttamente
    inviati e ricevuti dal microservizio di logging.
    """
    # Genera log di test con diversi livelli e metadati
    logger.debug("Test debug log dal backend Django", extra={
        'test_id': 'debug-test-1',
        'endpoint': 'test_logging'
    })
    
    logger.info("Test info log dal backend Django", extra={
        'test_id': 'info-test-1',
        'endpoint': 'test_logging'
    })
    
    logger.warning("Test warning log dal backend Django", extra={
        'test_id': 'warning-test-1',
        'endpoint': 'test_logging'
    })
    
    logger.error("Test error log dal backend Django", extra={
        'test_id': 'error-test-1',
        'endpoint': 'test_logging'
    })
    
    # Restituisci una risposta JSON
    return JsonResponse({
        'status': 'success',
        'message': 'Log di test generati con successo'
    })