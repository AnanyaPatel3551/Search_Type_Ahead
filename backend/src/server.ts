import app from './app';
import { config } from './config';
import { prisma } from './db/prisma';
import { redis } from './db/redis';
import { searchRepository } from './repositories/search.repository';
import { trieService } from './services/trie/TrieService';
import { batchService } from './services/batch.service';

// Start Express server listening on configured port
const server = app.listen(config.port, async () => {
  console.log(`[Server] Backend running in '${config.nodeEnv}' mode on port ${config.port}`);

  // Test database connection on startup
  try {
    await prisma.$connect();
    console.log('[Database] Successfully connected to PostgreSQL.');

    // Warm up the Trie index cache
    try {
      const allQueries = await searchRepository.getAllQueries();
      trieService.warmUp(allQueries);
    } catch (warmupError) {
      console.error('[Trie Warmup] Failed to build in-memory Trie on boot:', warmupError);
    }

    // Start background database batch flusher interval (every 5 seconds)
    batchService.startInterval();
  } catch (error) {
    console.error('[Database] PostgreSQL connection failed at boot:', error);
  }
});

/**
 * Handles graceful shutdown by releasing resources cleanly before exit.
 */
const handleGracefulShutdown = async (signal: string) => {
  console.log(`[Server] Received ${signal}. Initializing graceful shutdown sequence...`);

  // Stop accepting new HTTP requests
  server.close(async () => {
    console.log('[Server] HTTP socket connections closed.');

    // Disconnect Prisma PostgreSQL Client
    try {
      await prisma.$disconnect();
      console.log('[Database] PostgreSQL client disconnected.');
    } catch (error) {
      console.error('[Database] Failed to close PostgreSQL connection:', error);
    }

    // Disconnect Redis Client
    try {
      await redis.quit();
      console.log('[Redis] Redis connection client disconnected.');
    } catch (error) {
      console.error('[Redis] Failed to close Redis connection:', error);
    }

    console.log('[Server] Shutdown complete.');
    process.exit(0);
  });

  // Force termination after timeout
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out. Force exiting process...');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  handleGracefulShutdown('UNCAUGHT_EXCEPTION');
});
