/**
 * Represents a single node inside the Search Autocomplete Trie.
 */
export class TrieNode {
  // Pointers to child characters
  public children: Map<string, TrieNode>;
  
  // Flag indicating if this node marks the end of a valid search query
  public isWord: boolean;
  
  // Tracks search frequency for queries terminating at this node
  public searchCount: number;
  
  // Stores the full query string at the terminal node to optimize DFS traversal speeds
  public word: string | null;

  constructor() {
    this.children = new Map<string, TrieNode>();
    this.isWord = false;
    this.searchCount = 0;
    this.word = null;
  }
}
