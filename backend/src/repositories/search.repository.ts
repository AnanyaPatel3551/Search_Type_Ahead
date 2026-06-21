import { prisma } from '../db/prisma';

export class SearchRepository {
  /**
   * Atomically upserts a query phrase:
   * Increments searchCount if the query exists, otherwise creates it with count = 1.
   */
  public async upsertQuery(query: string) {
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
