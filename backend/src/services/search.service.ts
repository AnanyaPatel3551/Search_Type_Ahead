import { searchRepository } from '../repositories/search.repository';
import { trieService } from './trie/TrieService';

export class SearchService {
  /**
   * Records a user search query:
   * 1. Persists the query and increments its count in PostgreSQL.
   * 2. Synchronizes the in-memory Trie index with the new search.
   */
  public async recordSearch(query: string): Promise<void> {
    // Write to DB first (atomic upsert)
    await searchRepository.upsertQuery(query);

    // Synchronously update the in-memory Trie representation
    trieService.insertOrIncrement(query, 1);
  }
}

export const searchService = new SearchService();
export default searchService;
