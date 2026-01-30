import { g } from './xml-grammar';

describe('XML Grammar', () => {
  it('should parse a simple XML document', () => {
    const xml = '<root>Hello</root>';
    const result = g.parse("document", xml);
    expect(result).not.toBeNull();
    expect(result?.wellFormed).toBe(true);
  });

  it('should fail on malformed XML (mismatched tags)', () => {
    const xml = '<root>Hello</foo>';
    // Depending on implementation, it might return null or a non-well-formed node.
    // The current verifyRule implementation sets wellFormed = false.
    // However, the "element" rule uses "verifyRule", which runs AFTER the parse.
    // Wait, mismatched tags might be caught by the rule itself if implemented as Reference matching?
    // In our grammar, "element" is: alt(EmptyElemTag, seq(STag, content, ETag))
    // STag matches <root>. content matches Hello. ETag matches </foo>.
    // The parser combinator succeeds because ETag is just </ Name ... >.
    // So it returns a node. But verifyRule("element") should set wellFormed = false.
    
    const result = g.parse("document", xml);
    // It parses successfully as a structure, but validation fails
    expect(result).not.toBeNull();
    expect(result?.wellFormed).toBe(false);
  });

  it('should parse attributes', () => {
    const xml = '<root id="1" class=\'main\' />';
    const result = g.parse("document", xml);
    expect(result).not.toBeNull();
    expect(result?.wellFormed).toBe(true);
  });

  it('should fail on duplicate attributes', () => {
      const xml = '<root id="1" id="2" />';
      const result = g.parse("document", xml);
      expect(result).not.toBeNull();
      // "STag" or "EmptyElemTag" has verifyRule for unique attributes
      // <root ... /> matches EmptyElemTag.
      // The document root has children: prolog, element, misc.
      // element child has EmptyElemTag.
      // If EmptyElemTag is not well-formed, does it propagate?
      // Yes, Sequence/Repeat propagate wellFormed status.
      expect(result?.wellFormed).toBe(false);
  });
});
