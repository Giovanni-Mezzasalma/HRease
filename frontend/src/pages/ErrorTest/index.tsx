// frontend/src/pages/ErrorTest/index.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

// Componente che lancerà un errore dopo un ritardo
const ErrorThrower: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Questo causerà un errore non gestito
      throw new Error("Test error: Unhandled error from ErrorThrower component");
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return <div>Questo componente lancerà un errore tra 3 secondi...</div>;
};

// Componente che causerà un errore nella promise
const PromiseErrorThrower: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Questo causerà un errore in una Promise non gestita
      new Promise((_, reject) => {
        reject(new Error("Test error: Unhandled promise rejection"));
      });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return <div>Questo componente lancerà un errore di Promise tra 3 secondi...</div>;
};

// Componente che causerà un errore di rendering
const RenderErrorThrower: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test error: Error during rendering");
  }
  
  return <div>Componente renderizzato correttamente</div>;
};

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Registra il test nel log quando il componente è montato
    logger.info('ErrorTest component mounted', {
      component: 'ErrorTest',
      testType: 'error_boundary'
    });
    
    return () => {
      logger.info('ErrorTest component unmounted', {
        component: 'ErrorTest',
        testType: 'error_boundary'
      });
    };
  }, []);
  
  if (hasError) {
    return <div className="alert alert-danger">Si è verificato un errore nel rendering!</div>;
  }
  
  try {
    return <>{children}</>;
  } catch (error) {
    setHasError(true);
    logger.error('Error in error boundary', {
      error: error instanceof Error ? error.message : String(error)
    });
    return <div className="alert alert-danger">Si è verificato un errore nel rendering!</div>;
  }
};

const ErrorTest: React.FC = () => {
  const { user } = useAuth();
  const [shouldThrow, setShouldThrow] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showPromiseError, setShowPromiseError] = useState(false);
  
  useEffect(() => {
    // Registra il test nel log quando il componente è montato
    logger.info('ErrorTest component mounted', {
      component: 'ErrorTest',
      userId: user?.id
    });
    
    return () => {
      logger.info('ErrorTest component unmounted', {
        component: 'ErrorTest',
        userId: user?.id
      });
    };
  }, [user]);
  
  const triggerRenderError = () => {
    logger.info('User clicked trigger render error button', {
      userId: user?.id,
      action: 'triggerRenderError'
    });
    setShouldThrow(true);
  };
  
  const triggerUnhandledError = () => {
    logger.info('User clicked trigger unhandled error button', {
      userId: user?.id,
      action: 'triggerUnhandledError'
    });
    setShowError(true);
  };
  
  const triggerPromiseError = () => {
    logger.info('User clicked trigger promise error button', {
      userId: user?.id,
      action: 'triggerPromiseError'
    });
    setShowPromiseError(true);
  };

  const forceSyntaxError = () => {
    logger.info('User clicked force syntax error button', {
      userId: user?.id,
      action: 'forceSyntaxError'
    });
    
    // @ts-ignore
    // Questo causerà un errore di sintassi a runtime
    const undefinedFunction = undefined;
    // @ts-expect-error - Chiamata intenzionale a una funzione undefined per testare il logging degli errori

    undefinedFunction();
  };
  
  return (
    <div className="container mt-5">
      <h1>Test di logging degli errori non gestiti</h1>
      <p>Questa pagina contiene componenti che generano diversi tipi di errori per testare il sistema di logging.</p>
      
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">Errore durante il rendering</div>
            <div className="card-body">
              <p>Questo test genera un errore durante il rendering di un componente.</p>
              <button 
                className="btn btn-danger"
                onClick={triggerRenderError}
                disabled={shouldThrow}
              >
                Genera errore di rendering
              </button>
              
              <div className="mt-3">
                <ErrorBoundary>
                  <RenderErrorThrower shouldThrow={shouldThrow} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">Errore non gestito</div>
            <div className="card-body">
              <p>Questo test genera un errore non gestito dopo 3 secondi.</p>
              <button 
                className="btn btn-danger"
                onClick={triggerUnhandledError}
                disabled={showError}
              >
                Genera errore non gestito
              </button>
              
              <div className="mt-3">
                {showError && <ErrorThrower />}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">Errore di Promise non gestita</div>
            <div className="card-body">
              <p>Questo test genera un errore in una Promise non gestita.</p>
              <button 
                className="btn btn-danger"
                onClick={triggerPromiseError}
                disabled={showPromiseError}
              >
                Genera errore di Promise
              </button>
              
              <div className="mt-3">
                {showPromiseError && <PromiseErrorThrower />}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">Errore di sintassi a runtime</div>
            <div className="card-body">
              <p>Questo test genera un errore di sintassi chiamando una funzione undefined.</p>
              <button 
                className="btn btn-danger"
                onClick={forceSyntaxError}
              >
                Genera errore di sintassi
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 alert alert-info">
        <h4>Istruzioni</h4>
        <p>Dopo aver generato un errore, controlla il dashboard di logging (http://localhost:8080) e seleziona la sorgente "frontend" per verificare che l'errore sia stato registrato correttamente.</p>
      </div>
    </div>
  );
};

export default ErrorTest;