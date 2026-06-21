import { TrieNode } from './TrieNode';

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a query string with its search frequency count.
   * If the query already exists, its count is updated to the new value.
   * Complexity: O(L) where L is the length of the query.
   */
  public insert(query: string, count: number): void {
    let current = this.root;

    for (const char of query) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }

    current.isWord = true;
    current.word = query;
    current.searchCount = count;
  }

  /**
   * Increments the searchCount of a query by a given value.
   * If the query does not exist, it is inserted with the increment value.
   * Complexity: O(L) where L is the length of the query.
   */
  public increment(query: string, incrementBy: number = 1): void {
    let current = this.root;

    for (const char of query) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }

    if (!current.isWord) {
      current.isWord = true;
      current.word = query;
      current.searchCount = 0;
    }
    
    current.searchCount += incrementBy;
  }

  /**
   * Searches the Trie for all queries matching the given prefix.
   * Suggestions are sorted by count in descending order and capped at 10.
   * Complexity: O(P + M log M) where P is prefix length, M is count of matched words.
   */
  public search(prefix: string): Array<{ query: string; count: number }> {
    let current = this.root;

    // 1. Navigate to the node representing the end of the prefix
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return []; // No matches found
      }
      current = current.children.get(char)!;
    }

    // 2. Perform DFS to collect all words in the subtree starting from this node
    const matches: Array<{ query: string; count: number }> = [];
    this.collectAllWords(current, matches);

    // 3. Sort matches by searchCount descending and limit to top 10 results
    return matches
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Recursively traverses nodes using DFS to collect all terminal queries.
   */
  private collectAllWords(node: TrieNode, results: Array<{ query: string; count: number }>): void {
    if (node.isWord && node.word !== null) {
      results.push({
        query: node.word,
        count: node.searchCount,
      });
    }

    for (const childNode of node.children.values()) {
      this.collectAllWords(childNode, results);
    }
  }

  /**
   * Retrieves the frequency count of a specific exact matching query.
   * Returns 0 if the query does not exist in the Trie.
   */
  public getCount(query: string): number {
    let current = this.root;
    for (const char of query) {
      if (!current.children.has(char)) {
        return 0;
      }
      current = current.children.get(char)!;
    }
    return current.isWord ? current.searchCount : 0;
  }
}
