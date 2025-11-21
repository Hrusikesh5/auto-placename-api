
const app = require('./app');
const config = require('./config');
const elasticsearchService = require('./services/elasticsearch');
const cacheService = require('./services/cache');

const PORT = config.PORT;

async function startServer() {
  try {
    console.log('\n🚀 Starting Location Search Service...\n');
    console.log(`📍 Environment: ${config.NODE_ENV}`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`📍 ES URL: ${config.ELASTICSEARCH.url}`);
    console.log(`📍 Redis: ${config.REDIS.host}:${config.REDIS.port}`);
    console.log(`📍 Google API: ${config.GOOGLE.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`📍 DeepL API: ${config.DEEPL.enabled ? 'Enabled' : 'Disabled'}\n`);

    try {
      const esConnected = await elasticsearchService.connect();
      if (esConnected) {
        console.log('✅ Elasticsearch connected\n');
      } else {
        console.log('⚠️  Elasticsearch not connected (will retry later)\n');
      }
    } catch (error) {
      console.error('⚠️  Elasticsearch connection failed:', error.message);
      console.log('⚠️  Service will continue without Elasticsearch\n');
    }

    // ✅ Try Redis (non-blocking)
    if (config.CACHE.enabled) {
      try {
        const redisConnected = await cacheService.connect();
        if (redisConnected) {
          console.log('✅ Redis connected\n');
        } else {
          console.log('⚠️  Redis not connected (caching disabled)\n');
        }
      } catch (error) {
        console.error('⚠️  Redis connection failed:', error.message);
        console.log('⚠️  Service will continue without Redis cache\n');
      }
    } else {
      console.log('ℹ️  Redis cache disabled by config\n');
    }

    // ✅ CRITICAL: Bind to 0.0.0.0 for Render
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('✅ ========================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${config.NODE_ENV}`);
      console.log('✅ ========================================');
      console.log('');
      console.log('📍 Available endpoints:');
      console.log(`   - GET  /health`);
      console.log(`   - GET  /api/health`);
      console.log(`   - GET  /api/test`);
      console.log(`   - GET  /api/search?q=<query>&lang=<language>`);
      console.log(`   - POST /api/save-result`);
      console.log('');
    });

    // ✅ Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // ✅ Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
      shutdown(server);
    });

    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT received, shutting down gracefully...');
      shutdown(server);
    });

    // ✅ Handle uncaught errors (don't crash immediately)
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error(error.stack);
      // Don't exit immediately - log and continue
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise);
      console.error('❌ Reason:', reason);
      // Don't exit immediately - log and continue
    });

  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

async function shutdown(server) {
  console.log('\n🛑 Shutting down...\n');
  
  const timeout = setTimeout(() => {
    console.error('❌ Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000); // Force exit after 10s

  try {
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }

    // Try to close connections gracefully
    try {
      await elasticsearchService.disconnect();
      console.log('✅ Elasticsearch disconnected');
    } catch (error) {
      console.error('⚠️  ES disconnect error:', error.message);
    }

    try {
      await cacheService.disconnect();
      console.log('✅ Redis disconnected');
    } catch (error) {
      console.error('⚠️  Redis disconnect error:', error.message);
    }

    clearTimeout(timeout);
    console.log('\n✅ Application shut down successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    clearTimeout(timeout);
    process.exit(1);
  }
}

startServer();