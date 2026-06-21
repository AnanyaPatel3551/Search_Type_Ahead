import { prisma } from '../db/prisma';
import { metricsService } from '../services/metrics.service';

const verbs = [
  'how to learn', 'how to use', 'best practices for', 'tutorial on', 'guide to',
  'introduction to', 'advanced techniques in', 'examples of', 'troubleshooting', 'understanding',
  'setup guide for', 'how to debug', 'optimizing', 'history of', 'alternative to',
  'features of', 'getting started with', 'deep dive into', 'mastering', 'comparison of',
  'why use', 'when to use', 'difference between', 'pros and cons of', 'common errors in',
  'how to fix', 'how to deploy', 'scaling', 'securing', 'testing',
  'performance tips for', 'design patterns for', 'clean architecture in', 'cheat sheet for', 'interview questions on',
  'roadmap for', 'complete course on', 'crash course in', 'building an app with', 'integrating'
]; // 40 verbs

const subjects = [
  'react', 'vue', 'angular', 'nextjs', 'svelte', 'typescript', 'javascript', 'nodejs',
  'expressjs', 'nestjs', 'python', 'django', 'flask', 'fastapi', 'golang', 'rust',
  'cplusplus', 'java', 'spring boot', 'kotlin', 'swift', 'flutter', 'react native', 'docker',
  'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'graphql', 'rest api', 'postgresql',
  'mysql', 'mongodb', 'redis', 'elasticsearch', 'prisma orm', 'sequelize', 'git', 'github actions',
  'jenkins', 'ci cd pipelines', 'microservices', 'serverless', 'machine learning', 'data science', 'deep learning', 'pandas',
  'numpy', 'pytorch', 'tensorflow', 'web sockets', 'tailwind css', 'bootstrap', 'sass', 'css grid',
  'html5 canvas', 'webgl', 'webassembly', 'oauth2', 'jwt auth', 'system design', 'distributed systems', 'consistent hashing',
  'trie data structure', 'caching strategies', 'rate limiting', 'load balancing', 'message queues', 'rabbitmq', 'apache kafka', 'graphql federations',
  'web performance', 'seo optimization', 'chrome devtools', 'jest testing', 'cypress end to end', 'playwright tests', 'unit testing', 'integration testing',
  'continuous delivery', 'agile scrum', 'object oriented programming', 'functional programming', 'design patterns', 'solid principles', 'clean code', 'refactoring',
  'cloud computing', 'cyber security', 'cryptography', 'blockchain', 'smart contracts', 'ethereum', 'solidity', 'web3',
  'nextjs server actions', 'react server components', 'nuxt js', 'gatsby', 'webpack', 'vite build', 'rollup', 'esbuild',
  'redis stack', 'redis pub sub', 'postgres indexing', 'sql joins', 'database replication', 'nosql databases', 'dynamodb', 'cassandra',
  'hadoop', 'apache spark', 'power bi', 'tableau', 'excel vba', 'statistics', 'linear algebra', 'calculus'
]; // 110 subjects

const environments = [
  'in production', 'for beginners', 'in windows', 'in linux', 'in macOS', 'in docker',
  'on aws', 'on heroku', 'on vercel', 'on netlify', 'step by step', 'with code examples',
  'without libraries', 'for intermediate developers', 'in 2026', 'best way', 'with high performance', 'for mobile apps',
  'in microservices', 'with real time updates', 'with server side rendering', 'with static site generation', 'using clean architecture', 'using typescript',
  'using javascript', 'using python', 'using java', 'using rust', 'using golang', 'using spring boot',
  'on kubernetes', 'with automated testing', 'with docker compose', 'in staging environment', 'locally', 'for enterprise applications',
  'with github actions', 'with secure access', 'without downtime', 'with database replication'
]; // 40 environments

/**
 * Automatically loads 100,000 synthetic queries into PostgreSQL if the database is underpopulated.
 */
export async function seedLargeDatasetIfNeeded(): Promise<void> {
  try {
    const startTime = Date.now();
    
    // Increment DB reads count for checking count
    metricsService.recordDatabaseReads(1);
    const count = await prisma.searchQuery.count();
    
    if (count >= 100000) {
      console.log(`[Dataset Loader] Database has ${count} records. No seeding required.`);
      return;
    }

    console.log(`[Dataset Loader] Current database size is ${count}. Generating 100,000 synthetic queries...`);

    const uniqueQueriesSet = new Set<string>();
    const targetSize = 100000;
    
    // Generate unique search terms
    while (uniqueQueriesSet.size < targetSize) {
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const env = environments[Math.floor(Math.random() * environments.length)];
      
      const query = `${verb} ${subject} ${env}`.toLowerCase().trim();
      uniqueQueriesSet.size < targetSize && uniqueQueriesSet.add(query);
    }

    const queriesArray = Array.from(uniqueQueriesSet);
    const dataToInsert = queriesArray.map(q => ({
      query: q,
      searchCount: Math.floor(Math.random() * 5000) + 1, // Realistic weight frequency (1-5000)
    }));

    console.log('[Dataset Loader] Committing bulk inserts to PostgreSQL in batches of 10,000...');

    const batchSize = 10000;
    let totalInserted = 0;
    
    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize);
      
      // Perform batch creation
      const res = await prisma.searchQuery.createMany({
        data: batch,
        skipDuplicates: true,
      });

      totalInserted += res.count;
      metricsService.recordDatabaseWrites(batch.length);
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`[Dataset Loader] Seeded ${totalInserted} unique records successfully in ${elapsed.toFixed(2)}s!`);
  } catch (error) {
    console.error('[Dataset Loader ERROR] Generation or load failed:', error);
  }
}
