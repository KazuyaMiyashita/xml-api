import type { CST } from "./xml-cst";

/**
 * Detects the indentation string preceding a CST node.
 * Scans backwards from the node's start position until a newline or non-whitespace character is found.
 *
 * @param node The CST node to analyze.
 * @param source The full source string.
 * @returns The indentation string (e.g., "  ", "\t") if the node starts on a new line (or start of file).
 *          Returns null if the node follows non-whitespace content on the same line (inline).
 */
export function detectIndent(node: CST, source: string): string | null {
  let i = node.start - 1;
  while (i >= 0) {
    const char = source[i];
    if (char === "\n") {
      return source.slice(i + 1, node.start);
    }
    if (char !== " " && char !== "\t" && char !== "\r") {
      // Found non-whitespace on the same line, so no clean indent.
      return null;
    }
    i--;
  }
  // Start of file
  if (node.start >= 0) {
    // Check if the line from 0 to node.start is all whitespace
    const prefix = source.slice(0, node.start);
    if (/^\s*$/.test(prefix)) {
      return prefix;
    }
  }
  return null;
}