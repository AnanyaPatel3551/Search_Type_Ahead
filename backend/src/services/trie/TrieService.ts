import { Trie } from './Trie';

class TrieService {
  private trie: Trie;

  constructor() {
    this.trie = new Trie();
  }

  /**
   * Inserts a search term or increments its searchCount in the Trie index.
   */
  public insertOrIncrement(query: string, count: number = 1): void {
    this.trie.increment(query, count);
  }

  /**
   * Queries the Trie index for matching search suggestions.
   */
  public getSuggestions(prefix: string): Array<{ query: string; count: number }> {
    return this.trie.search(prefix);
  }

  /**
   * Bulks inserts database query items to build the initial Trie index state.
   */
  public warmUp(queries: Array<{ query: string; searchCount: number }>): void {
    const start = Date.now();
    console.log(`[TrieService] Warming up Trie index with ${queries.length} records...`);

    for (const record of queries) {
      this.trie.insert(record.query, record.searchCount);
    }

    const duration = Date.now() - start;
    console.log(`[TrieService] Trie warm up complete. Load time: ${duration}ms`);
  }

  /**
   * Returns exact match count for a query.
   */
  public getCount(query: string): number {
    return this.trie.getCount(query);
  }
}

export const trieService = new TrieService();
export default trieService;
