import crypto from 'crypto';

export class ConsistentHashRing {
  private ring: Map<number, string> = new Map();
  private sortedHashes: number[] = [];
  private virtualNodesCount: number;

  constructor(nodes: string[] = [], virtualNodesCount: number = 50) {
    this.virtualNodesCount = virtualNodesCount;
    nodes.forEach((node) => this.addNode(node));
  }

  /**
   * Generates a 32-bit unsigned integer hash for a given key string using MD5.
   */
  private hashKey(key: string): number {
    const md5 = crypto.createHash('md5').update(key).digest();
    // Read the first 4 bytes as a 32-bit big-endian unsigned integer
    return md5.readUInt32BE(0);
  }

  /**
   * Adds a physical server node to the ring by creating its virtual nodes.
   */
  public addNode(node: string): void {
    for (let i = 0; i < this.virtualNodesCount; i++) {
      const vNodeKey = `${node}-vnode-${i}`;
      const hash = this.hashKey(vNodeKey);
      this.ring.set(hash, node);
      this.sortedHashes.push(hash);
    }
    // Keep hashes sorted for binary search
    this.sortedHashes.sort((a, b) => a - b);
    console.log(`[Hash Ring] Added node: "${node}" (${this.virtualNodesCount} virtual nodes mapped)`);
  }

  /**
   * Removes a physical server node from the ring and cleans up its virtual nodes.
   */
  public removeNode(node: string): void {
    for (let i = 0; i < this.virtualNodesCount; i++) {
      const vNodeKey = `${node}-vnode-${i}`;
      const hash = this.hashKey(vNodeKey);
      this.ring.delete(hash);
    }
    // Rebuild sorted array
    this.sortedHashes = this.sortedHashes.filter((hash) => this.ring.has(hash));
    console.log(`[Hash Ring] Removed node: "${node}"`);
  }

  /**
   * Locates the physical server node mapped to a given cache key.
   */
  public locateNode(key: string): string | null {
    if (this.sortedHashes.length === 0) {
      return null;
    }

    const hash = this.hashKey(key);

    // Binary search on sorted hashes to locate the first hash >= key's hash
    let low = 0;
    let high = this.sortedHashes.length - 1;
    let targetIndex = 0; // Wrap around to index 0 by default (first node on circular ring)

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.sortedHashes[mid] === hash) {
        targetIndex = mid;
        break;
      } else if (this.sortedHashes[mid] < hash) {
        low = mid + 1;
      } else {
        targetIndex = mid; // Candidate found, look for smaller hashes >= key's hash
        high = mid - 1;
      }
    }

    const targetHash = this.sortedHashes[targetIndex];
    return this.ring.get(targetHash) || null;
  }

  /**
   * Returns a debug representation of the current ring nodes distribution.
   */
  public getRingDebugInfo(): { totalVirtualNodes: number; nodes: string[] } {
    const nodesSet = new Set(this.ring.values());
    return {
      totalVirtualNodes: this.sortedHashes.length,
      nodes: Array.from(nodesSet),
    };
  }
}
