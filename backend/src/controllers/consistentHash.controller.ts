import { Request, Response, NextFunction } from 'express';
import { sharedHashRing as hashRing } from '../utils/consistentHash';

export class ConsistentHashController {
  /**
   * Runs consistent hashing simulation, enabling dynamic adding/removing nodes and key lookups.
   * GET /consistent-hash/simulate
   */
  public handleSimulation(req: Request, res: Response, next: NextFunction): void {
    try {
      const { key, addNode, removeNode } = req.query;

      // Handle node additions
      if (typeof addNode === 'string' && addNode.trim() !== '') {
        hashRing.addNode(addNode.trim());
      }

      // Handle node removals
      if (typeof removeNode === 'string' && removeNode.trim() !== '') {
        hashRing.removeNode(removeNode.trim());
      }

      // Test map keys
      const sampleKeys = ['iphone', 'macbook', 'ipad', 'weather', 'search', 'typeahead', 'redis', 'database'];
      const mappings = sampleKeys.map((k) => ({
        key: k,
        node: hashRing.locateNode(k),
      }));

      // Lookup target node for current search key
      let lookupResult = null;
      if (typeof key === 'string' && key.trim() !== '') {
        const queryKey = key.trim().toLowerCase();
        lookupResult = {
          key: queryKey,
          node: hashRing.locateNode(queryKey),
        };
      }

      res.status(200).json({
        status: 'success',
        ringState: hashRing.getRingDebugInfo(),
        sampleMappings: mappings,
        ...(lookupResult && { lookup: lookupResult }),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const consistentHashController = new ConsistentHashController();
export default consistentHashController;
