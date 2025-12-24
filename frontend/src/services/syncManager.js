import api from '../api';
import offlineStorage from './offlineStorage';

class SyncManager {
  /**
   * Sincroniza todos los datos pendientes de la cola
   */
  async syncAll() {
    const queue = await offlineStorage.getSyncQueue();
    
    if (queue.length === 0) {
      return {
        success: true,
        synced: 0,
        errors: []
      };
    }

    let synced = 0;
    const errors = [];

    for (const item of queue) {
      try {
        const success = await this.syncItem(item);
        if (success) {
          await offlineStorage.removeFromSyncQueue(item.id);
          synced++;
        } else {
          // Incrementar contador de reintentos
          await offlineStorage.incrementSyncRetry(item.id);
          const updatedItem = await offlineStorage.getSyncQueue();
          const currentItem = updatedItem.find(i => i.id === item.id);
          
          // Si tiene más de 3 reintentos, marcar como error
          if (currentItem && currentItem.retries >= 3) {
            errors.push({
              item: currentItem,
              error: 'Máximo de reintentos alcanzado'
            });
            await offlineStorage.removeFromSyncQueue(item.id);
          }
        }
      } catch (error) {
        console.error('Error sincronizando item:', error);
        errors.push({
          item,
          error: error.message
        });
        await offlineStorage.incrementSyncRetry(item.id);
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors
    };
  }

  /**
   * Sincroniza un item individual de la cola
   */
  async syncItem(item) {
    try {
      const config = {
        headers: {
          ...item.headers,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };

      let response;
      switch (item.method.toUpperCase()) {
        case 'GET':
          response = await api.get(item.url, config);
          break;
        case 'POST':
          response = await api.post(item.url, item.data, config);
          break;
        case 'PUT':
          response = await api.put(item.url, item.data, config);
          break;
        case 'PATCH':
          response = await api.patch(item.url, item.data, config);
          break;
        case 'DELETE':
          response = await api.delete(item.url, config);
          break;
        default:
          throw new Error(`Método HTTP no soportado: ${item.method}`);
      }

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Error en syncItem:', error);
      return false;
    }
  }

  /**
   * Sincroniza datos específicos desde el servidor al almacenamiento local
   */
  async syncFromServer() {
    try {
      // Sincronizar asignaturas
      const asignaturasResponse = await api.get('/asignaturas/');
      if (asignaturasResponse.data) {
        await offlineStorage.saveAsignaturas(asignaturasResponse.data);
      }

      // Sincronizar temas (necesitaríamos obtener todos los temas)
      // Por ahora, esto se hará bajo demanda cuando se acceda a una asignatura

      return {
        success: true,
        message: 'Datos sincronizados desde el servidor'
      };
    } catch (error) {
      console.error('Error sincronizando desde servidor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sincroniza datos específicos desde el almacenamiento local al servidor
   */
  async syncToServer() {
    return await this.syncAll();
  }
}

export default new SyncManager();

