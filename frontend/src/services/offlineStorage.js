import Dexie from 'dexie';

// Definir la base de datos IndexedDB
class QuizDatabase extends Dexie {
  constructor() {
    super('QuizAppDB');
    
    // Definir esquemas de tablas
    this.version(1).stores({
      asignaturas: '++id, nombre, usuario_id, updated_at',
      temas: '++id, nombre, asignatura_id, updated_at',
      preguntas: '++id, texto, tema_id, respuesta_correcta_id, ayuda, updated_at',
      respuestas: '++id, texto, pregunta_id, updated_at',
      progresoTests: '++id, usuario_id, tipo, filtro, id_contenido, pregunta_actual, preguntas_id, respuestas_correctas, respondidas, totalRespondidas, completado, finalizado_en, creado_en, updated_at',
      syncQueue: '++id, method, url, data, headers, timestamp, retries',
      cache: '++id, key, value, timestamp'
    });
  }
}

// Crear instancia de la base de datos
const db = new QuizDatabase();

// Servicio de almacenamiento offline
class OfflineStorage {
  // ========== ASIGNATURAS ==========
  async saveAsignaturas(asignaturas) {
    try {
      await db.asignaturas.clear();
      const asignaturasWithTimestamp = asignaturas.map(a => ({
        ...a,
        updated_at: new Date().toISOString()
      }));
      await db.asignaturas.bulkPut(asignaturasWithTimestamp);
      return true;
    } catch (error) {
      console.error('Error guardando asignaturas:', error);
      return false;
    }
  }

  async getAsignaturas() {
    try {
      return await db.asignaturas.toArray();
    } catch (error) {
      console.error('Error obteniendo asignaturas:', error);
      return [];
    }
  }

  async saveAsignatura(asignatura) {
    try {
      await db.asignaturas.put({
        ...asignatura,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error guardando asignatura:', error);
      return false;
    }
  }

  async deleteAsignatura(id) {
    try {
      await db.asignaturas.delete(id);
      return true;
    } catch (error) {
      console.error('Error eliminando asignatura:', error);
      return false;
    }
  }

  // ========== TEMAS ==========
  async saveTemas(temas) {
    try {
      await db.temas.clear();
      const temasWithTimestamp = temas.map(t => ({
        ...t,
        updated_at: new Date().toISOString()
      }));
      await db.temas.bulkPut(temasWithTimestamp);
      return true;
    } catch (error) {
      console.error('Error guardando temas:', error);
      return false;
    }
  }

  async getTemas(asignaturaId = null) {
    try {
      if (asignaturaId) {
        return await db.temas.where('asignatura_id').equals(asignaturaId).toArray();
      }
      return await db.temas.toArray();
    } catch (error) {
      console.error('Error obteniendo temas:', error);
      return [];
    }
  }

  async saveTema(tema) {
    try {
      await db.temas.put({
        ...tema,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error guardando tema:', error);
      return false;
    }
  }

  async deleteTema(id) {
    try {
      await db.temas.delete(id);
      return true;
    } catch (error) {
      console.error('Error eliminando tema:', error);
      return false;
    }
  }

  // ========== PREGUNTAS ==========
  async savePreguntas(preguntas) {
    try {
      await db.preguntas.clear();
      const preguntasWithTimestamp = preguntas.map(p => ({
        ...p,
        updated_at: new Date().toISOString()
      }));
      await db.preguntas.bulkPut(preguntasWithTimestamp);
      return true;
    } catch (error) {
      console.error('Error guardando preguntas:', error);
      return false;
    }
  }

  async getPreguntas(temaId = null) {
    try {
      if (temaId) {
        return await db.preguntas.where('tema_id').equals(temaId).toArray();
      }
      return await db.preguntas.toArray();
    } catch (error) {
      console.error('Error obteniendo preguntas:', error);
      return [];
    }
  }

  async savePregunta(pregunta) {
    try {
      await db.preguntas.put({
        ...pregunta,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error guardando pregunta:', error);
      return false;
    }
  }

  async deletePregunta(id) {
    try {
      await db.preguntas.delete(id);
      return true;
    } catch (error) {
      console.error('Error eliminando pregunta:', error);
      return false;
    }
  }

  // ========== RESPUESTAS ==========
  async saveRespuestas(respuestas) {
    try {
      await db.respuestas.clear();
      const respuestasWithTimestamp = respuestas.map(r => ({
        ...r,
        updated_at: new Date().toISOString()
      }));
      await db.respuestas.bulkPut(respuestasWithTimestamp);
      return true;
    } catch (error) {
      console.error('Error guardando respuestas:', error);
      return false;
    }
  }

  async getRespuestas(preguntaId = null) {
    try {
      if (preguntaId) {
        return await db.respuestas.where('pregunta_id').equals(preguntaId).toArray();
      }
      return await db.respuestas.toArray();
    } catch (error) {
      console.error('Error obteniendo respuestas:', error);
      return [];
    }
  }

  // ========== PROGRESO TESTS ==========
  async saveProgresoTest(progreso) {
    try {
      await db.progresoTests.put({
        ...progreso,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error guardando progreso test:', error);
      return false;
    }
  }

  async getProgresoTest(id) {
    try {
      return await db.progresoTests.get(id);
    } catch (error) {
      console.error('Error obteniendo progreso test:', error);
      return null;
    }
  }

  async getProgresoTests(usuarioId = null) {
    try {
      if (usuarioId) {
        return await db.progresoTests.where('usuario_id').equals(usuarioId).toArray();
      }
      return await db.progresoTests.toArray();
    } catch (error) {
      console.error('Error obteniendo progresos tests:', error);
      return [];
    }
  }

  async updateProgresoTest(id, updates) {
    try {
      await db.progresoTests.update(id, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error actualizando progreso test:', error);
      return false;
    }
  }

  // ========== COLA DE SINCRONIZACIÓN ==========
  async addToSyncQueue(method, url, data = null, headers = {}) {
    try {
      await db.syncQueue.add({
        method,
        url,
        data,
        headers,
        timestamp: new Date().toISOString(),
        retries: 0
      });
      return true;
    } catch (error) {
      console.error('Error agregando a cola de sincronización:', error);
      return false;
    }
  }

  async getSyncQueue() {
    try {
      return await db.syncQueue.toArray();
    } catch (error) {
      console.error('Error obteniendo cola de sincronización:', error);
      return [];
    }
  }

  async removeFromSyncQueue(id) {
    try {
      await db.syncQueue.delete(id);
      return true;
    } catch (error) {
      console.error('Error eliminando de cola de sincronización:', error);
      return false;
    }
  }

  async incrementSyncRetry(id) {
    try {
      const item = await db.syncQueue.get(id);
      if (item) {
        await db.syncQueue.update(id, { retries: item.retries + 1 });
      }
      return true;
    } catch (error) {
      console.error('Error incrementando reintentos:', error);
      return false;
    }
  }

  // ========== CACHE GENERAL ==========
  async setCache(key, value) {
    try {
      await db.cache.put({
        key,
        value,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error guardando en cache:', error);
      return false;
    }
  }

  async getCache(key) {
    try {
      const item = await db.cache.get(key);
      return item ? item.value : null;
    } catch (error) {
      console.error('Error obteniendo de cache:', error);
      return null;
    }
  }

  async clearCache() {
    try {
      await db.cache.clear();
      return true;
    } catch (error) {
      console.error('Error limpiando cache:', error);
      return false;
    }
  }

  // ========== UTILIDADES ==========
  async clearAll() {
    try {
      await db.asignaturas.clear();
      await db.temas.clear();
      await db.preguntas.clear();
      await db.respuestas.clear();
      await db.progresoTests.clear();
      await db.syncQueue.clear();
      await db.cache.clear();
      return true;
    } catch (error) {
      console.error('Error limpiando base de datos:', error);
      return false;
    }
  }
}

export default new OfflineStorage();

