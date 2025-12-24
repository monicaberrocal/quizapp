import React, { useContext } from 'react';
import { SyncContext } from '../context/SyncContext';

const ModeToggle = () => {
  const { mode, setMode, isSyncing } = useContext(SyncContext);

  const handleToggle = () => {
    const newMode = mode === 'online' ? 'offline' : 'online';
    setMode(newMode);
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <span className="badge bg-secondary">Modo:</span>
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="modeToggle"
          checked={mode === 'online'}
          onChange={handleToggle}
          disabled={isSyncing}
        />
        <label className="form-check-label" htmlFor="modeToggle">
          {mode === 'online' ? (
            <span className="text-success">
              <i className="bi bi-wifi"></i> Online
            </span>
          ) : (
            <span className="text-warning">
              <i className="bi bi-wifi-off"></i> Offline
            </span>
          )}
        </label>
      </div>
      {isSyncing && (
        <span className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Sincronizando...</span>
        </span>
      )}
    </div>
  );
};

export default ModeToggle;

