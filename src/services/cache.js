

const redis = require('redis');
const config = require('../config');

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.enabled = config.CACHE.enabled;
  }

  async connect() {
    // If cache is disabled, skip connection
    if (!this.enabled) {
      console.log(' Redis cache disabled (CACHE_ENABLED=false)');
      return true;
    }

    try {
      console.log('Connecting to Redis...');
      console.log(`   Host: ${config.REDIS.host}:${config.REDIS.port}`);

      this.client = redis.createClient({
        socket: {
          host: config.REDIS.host,
          port: config.REDIS.port,
          reconnectStrategy: (retries) => {
            return Math.min(retries * 50, 500);
          }
        }
      });

      // Handle errors
      this.client.on('error', (err) => {
        console.error('Redis error:', err.message);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connection established');
      });

      // Connect
      await this.client.connect();
      this.connected = true;

      // Test connection
      const ping = await this.client.ping();
      
      console.log('✓ Redis connected');
      console.log(`  PING response: ${ping}`);

      return true;
    } catch (error) {
      console.error('Redis connection failed:', error.message);
      console.error('  Continuing without cache...');
      this.connected = false;
      this.enabled = false; // Disable cache on error
      return false;
    }
  }

  isConnected() {
    return this.connected && this.enabled;
  }

  async get(key) {
    if (!this.isConnected()) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 86400) {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.client.setEx(
        key,
        ttl,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  async delete(key) {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.connected) {
      try {
        await this.client.quit();
        this.connected = false;
        console.log('Redis disconnected');
      } catch (error) {
        console.error('Error disconnecting Redis:', error.message);
      }
    }
  }
}

module.exports = new CacheService();