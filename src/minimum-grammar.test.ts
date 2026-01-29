import { g } from './minimum-grammar';
import { Node } from './parser';

// Helper to test a rule
function testRule(ruleName: string, input: string, shouldMatch: boolean = true) {
  const result = g.parse(ruleName, input);
  if (shouldMatch) {
    expect(result).not.toBeNull();
    expect(result?.getText(input)).toBe(input);
  } else {
    expect(result).toBeNull();
  }
}

// Validator function: Checks Element Type Match recursively
function validateElementTypeMatch(node: Node, input: string): boolean {
    // The node might be 'element' (if via Reference) or 'sequence') (if parsed directly from rule)
    if (node.type === 'element' || node.type === 'sequence') {
        // element ::= EmptyElemTag | STag content ETag
        // If it has children and children[0] is STag, it must have ETag at children[2]
        // Note: EmptyElemTag would have type 'EmptyElemTag', so it won't match 'sequence' unless unlabeled, 
        // but EmptyElemTag rule labels the sequence.
        // The 'STag content ETag' sequence is unlabeled in the element rule.
        
        if (node.children.length === 3 && node.children[0].type === 'STag' && node.children[2].type === 'ETag') {
            const stag = node.children[0];
            const etag = node.children[2];
            
            // STag -> < Name > (children: [<, Name, >])
            const startName = stag.children[1].getText(input);
            
            // ETag -> </ Name > (children: [</, Name, >])
            const endName = etag.children[1].getText(input);

            if (startName !== endName) {
                return false;
            }
        }
    }

    // Recursively check children
    for (const child of node.children) {
        if (!validateElementTypeMatch(child, input)) {
            return false;
        }
    }

    return true;
}

describe('Minimum Grammar Rules', () => {

  describe('Basic Components', () => {
    it('Name', () => {
      testRule('Name', 'p');
      testRule('Name', 'div');
      testRule('Name', 'h1');
    });

    it('CharData', () => {
      testRule('CharData', 'Hello');
      testRule('CharData', 'こんにちは');
      testRule('CharData', 'abc 123');
    });

    it('EmptyElemTag', () => {
      testRule('EmptyElemTag', '<br/>');
      testRule('EmptyElemTag', '<hr />');
      testRule('EmptyElemTag', '<img/>');
    });

    it('STag', () => {
      testRule('STag', '<p>');
      testRule('STag', '<div>');
    });

    // ETag test removed because it depends on context (stack) which is empty here.
    // It is tested within 'element' rules.
  });

  describe('Element Structure', () => {
    it('Simple Element', () => {
        testRule('element', '<p>Hello</p>');
    });

    it('Nested Element', () => {
        testRule('element', '<div><p>Nested</p></div>');
    });

    it('Mixed Content', () => {
        testRule('element', '<p>Hello<br/>World</p>');
    });

    it('should fail on mismatched tags', () => {
        // <p>Hello</div>
        // Parser succeeds (structure is valid per BNF), but validation fails
        const input = '<p>Hello</div>';
        const result = g.parse('element', input);
        expect(result).not.toBeNull();
        if (result) {
            expect(validateElementTypeMatch(result, input)).toBe(false);
        }
    });

    it('should fail on improper nesting', () => {
        // <div><p>Hello</div></p>
        // Inner element <p>...</div> matches 'element' structurally but fails validation
        const input = '<div><p>Hello</div></p>';
        const result = g.parse('element', input);
        expect(result).not.toBeNull();
        if (result) {
            expect(validateElementTypeMatch(result, input)).toBe(false);
        }
    });

    it('should pass on correct tags', () => {
        const input = '<p>Hello</p>';
        const result = g.parse('element', input);
        expect(result).not.toBeNull();
        if (result) {
            expect(validateElementTypeMatch(result, input)).toBe(true);
        }
    });
  });

  describe('Document Integration', () => {
    it('should parse the requested example', () => {
        const doc = '<p>こんにちは<hr/>お元気ですか</p>';
        testRule('document', doc);
    });

    it('should parse simple nested structure', () => {
        const doc = '<root><child>Text</child><empty/></root>';
        testRule('document', doc);
    });
  });

});
