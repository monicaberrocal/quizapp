import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detectar si la app ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    setIsInstalled(isStandalone);
    
    // En iOS, siempre mostrar instrucciones si no está instalada
    if (isIOS && !isStandalone) {
      setIsInstallable(true);
    } else if (!isStandalone) {
      // Para otros navegadores, detectar si se puede instalar
      setIsInstallable(true);
    }
  }, []);

  const handleInstallClick = () => {
    setShowInstructions(!showInstructions);
  };

  if (isInstalled) {
    return (
      <div className="alert alert-success d-flex align-items-center gap-2">
        <i className="bi bi-check-circle"></i>
        <span>App instalada correctamente</span>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-download"></i> Instalar App en iPhone/iPad
        </h5>
      </div>
      <div className="card-body">
        <p className="card-text">
          Instala esta app en tu iPhone para usarla como una app nativa, sin necesidad del navegador.
        </p>
        
        <button
          className="btn btn-primary mb-3"
          onClick={handleInstallClick}
        >
          {showInstructions ? 'Ocultar instrucciones' : 'Ver instrucciones de instalación'}
        </button>

        {showInstructions && (
          <div className="alert alert-info">
            <h6 className="fw-bold">Pasos para instalar en iPhone/iPad:</h6>
            <ol className="mb-0">
              <li className="mb-2">
                <strong>Abre esta página en Safari</strong> (no funciona en Chrome u otros navegadores)
              </li>
              <li className="mb-2">
                <strong>Toca el botón de compartir</strong> (el cuadrado con flecha hacia arriba) en la parte inferior
              </li>
              <li className="mb-2">
                <strong>Desplázate hacia abajo</strong> y selecciona <strong>"Añadir a pantalla de inicio"</strong>
              </li>
              <li className="mb-2">
                <strong>Personaliza el nombre</strong> si lo deseas y toca <strong>"Añadir"</strong>
              </li>
              <li>
                <strong>¡Listo!</strong> La app aparecerá como un icono en tu pantalla de inicio y funcionará como una app nativa
              </li>
            </ol>
            
            <div className="mt-3 p-3 bg-light rounded">
              <h6 className="fw-bold">¿Qué significa esto?</h6>
              <ul className="mb-0">
                <li>✅ La app se abrirá sin barra del navegador</li>
                <li>✅ Funcionará offline cuando esté instalada</li>
                <li>✅ Se verá y funcionará como una app nativa</li>
                <li>✅ Se actualizará automáticamente cuando haya cambios</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPWA;

