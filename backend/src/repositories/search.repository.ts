import { prisma } from '../db/prisma';
import { metricsService } from '../services/metrics.service';

export class SearchRepository {
  /**
   * Atomically upserts a query phrase:
   * Increments searchCount if the query exists, otherwise creates it with count = 1.
   */
  public async upsertQuery(query: string) {
    metricsService.recordDatabaseWrites(1);
    return prisma.searchQuery.upsert({
      where: {
        query,
      },
      update: {
        searchCount: {
          increment: 1,
        },
      },
      create: {
        query,
        searchCount: 1,
      },
    });
  }

  /**
   * Retrieves all search queries and their counts from the database.
   */
  public async getAllQueries() {
    metricsService.recordDatabaseReads(1);
    return prisma.searchQuery.findMany({
      select: {
        query: true,
        searchCount: true,
      },
    });
  }
}

export const searchRepository = new SearchRepository();
export default searchRepository;
