import type { Node as PMNode } from "prosemirror-model";
import { Plugin, PluginKey, type Transaction } from "prosemirror-state";

export const idPluginKey = new PluginKey<Map<string, number>>("idPlugin");

// Helper to scan a node and populate the map
const scan = (
  node: PMNode,
  pos: number,
  map: Map<string, number>,
  visited: Set<string>,
) => {
  const modelId = node.attrs.modelId;
  if (modelId && !visited.has(modelId)) {
    map.set(modelId, pos);
    visited.add(modelId);
  }
  // Recurse into children
  // Note: We use node.forEach instead of descendants for controlled recursion
  node.forEach((child, offset) => {
    scan(child, pos + 1 + offset, map, visited);
  });
};

export const idPlugin = new Plugin<Map<string, number>>({
  key: idPluginKey,
  state: {
    init(_config, instance) {
      const map = new Map<string, number>();
      const visited = new Set<string>();
      scan(instance.doc, 0, map, visited);
      return map;
    },
    apply(tr: Transaction, oldMap: Map<string, number>, _oldState, newState) {
      // 1. If no document change, just return old map
      if (!tr.docChanged) return oldMap;

      // Re-evaluating: Full Scan is safe and likely fast enough for < 50k words.
      const newMap = new Map<string, number>();
      const visited = new Set<string>();
      scan(newState.doc, 0, newMap, visited);
      return newMap;
    },
  },
});
