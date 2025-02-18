class CacheService {
  constructor(defaultDuration = 7 * 24 * 60 * 60 * 1000) {
    this.cache = new Map();
    this.DEFAULT_DURATION = defaultDuration;

    // Iniciar limpieza automática del caché
    this.startCleanupInterval();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (this.isExpired(item.timestamp)) {
      this.delete(key);
      return null;
    }

    // Actualizar timestamp de último acceso para métricas
    item.lastAccessed = Date.now();
    return item.data;
  }

  set(key, data, duration) {
    const timestamp = Date.now();
    this.cache.set(key, {
      data,
      timestamp,
      lastAccessed: timestamp,
      expiresAt: timestamp + (duration || this.DEFAULT_DURATION)
    });
  }

  delete(key) {
    return this.cache.delete(key);
  }

  isExpired(timestamp) {
    return Date.now() - timestamp > this.DEFAULT_DURATION;
  }

  clear() {
    this.cache.clear();
  }

  // Obtener información sobre el estado del caché
  getStats() {
    const now = Date.now();
    let totalItems = 0;
    let expiredItems = 0;
    let oldestItem = now;
    let newestItem = 0;

    this.cache.forEach((item) => {
      totalItems++;
      if (this.isExpired(item.timestamp)) {
        expiredItems++;
      }
      oldestItem = Math.min(oldestItem, item.timestamp);
      newestItem = Math.max(newestItem, item.timestamp);
    });

    return {
      totalItems,
      expiredItems,
      oldestItemAge: now - oldestItem,
      newestItemAge: now - newestItem,
      cacheSize: this.cache.size
    };
  }

  // Limpieza automática del caché
  startCleanupInterval() {
    // Limpiar el caché cada hora
    this.cleanupInterval = setInterval(() => {
      console.log('Iniciando limpieza automática del caché...');
      let itemsRemoved = 0;

      this.cache.forEach((item, key) => {
        if (this.isExpired(item.timestamp)) {
          this.delete(key);
          itemsRemoved++;
        }
      });

      if (itemsRemoved > 0) {
        console.log(`Limpieza completada: ${itemsRemoved} items removidos`);
      }
    }, 60 * 60 * 1000); // 1 hora
  }

  // Limpiar el intervalo cuando ya no se necesite
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = CacheService;