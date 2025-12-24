import { createContext, useState, useEffect, useContext } from 'react';
import offlineStorage from '../services/offlineStorage';
import syncManager from '../services/syncManager';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  // Obtener modo inicial del localStorage o default 'online'
  const [mode, setModeState] = useState(() => {
    const savedMode = localStorage.getItem('app_mode');
    return savedMode || 'online';
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    message: '',
    type: 'info' // 'info', 'success', 'error'
  });

  // Guardar modo en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('app_mode', mode);
  }, [mode]);

  // Función para cambiar el modo
  const setMode = async (newMode) => {
    if (newMode === mode) return;

    setModeState(newMode);

    // Si cambia de offline a online, sincronizar automáticamente
    if (newMode === 'online' && mode === 'offline') {
      await sync();
    }
  };

  // Función de sincronización
  const sync = async () => {
    if (mode !== 'online') {
      setSyncStatus({
        message: 'Debes estar en modo online para sincronizar',
        type: 'error'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({
      message: 'Sincronizando datos...',
      type: 'info'
    });

    try {
      const result = await syncManager.syncAll();
      
      if (result.success) {
        setSyncStatus({
          message: `Sincronización completada: ${result.synced} elementos sincronizados`,
          type: 'success'
        });
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSyncStatus({
            message: '',
            type: 'info'
          });
        }, 3000);
      } else {
        setSyncStatus({
          message: `Error en sincronización: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      setSyncStatus({
        message: 'Error al sincronizar datos',
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const value = {
    mode,
    setMode,
    isSyncing,
    syncStatus,
    sync,
    isOnline: mode === 'online',
    isOffline: mode === 'offline'
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export { SyncContext };

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync debe usarse dentro de SyncProvider');
  }
  return context;
};

export default SyncProvider;

