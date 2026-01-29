import { g } from './minimum-grammar';

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

    it('ETag', () => {
      testRule('ETag', '</p>');
      testRule('ETag', '</div>');
    });
  });

  describe('Attribute Support', () => {
      it('Attribute Rule', () => {
          testRule('Attribute', 'id="123"');
          testRule('Attribute', "class='main'");
      });

      it('STag with Attributes', () => {
          testRule('STag', '<div id="container">');
          testRule('STag', '<a href="https://example.com" target="_blank">');
          testRule('STag', '<span class="foo" >'); // trailing space
      });

      it('EmptyElemTag with Attributes', () => {
          testRule('EmptyElemTag', '<img src="cat.jpg"/>');
          testRule('EmptyElemTag', '<input type="text" value="hello" />');
      });
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
        const input = '<p>Hello</div>';
        const result = g.parse('element', input);
        expect(result).not.toBeNull();
        expect(result?.wellFormed).toBe(false);
    });

    it('should fail on improper nesting', () => {
        // <div><p>Hello</div></p>
        const input = '<div><p>Hello</div></p>';
        const result = g.parse('element', input);
        expect(result).not.toBeNull();
        expect(result?.wellFormed).toBe(false);
    });

    it('If the inner well-formed check fails, the outer one also fails.', () => {
        const input = '<outer><inner>Hello</innermismatch></outer>';
        const result = g.parse('element', input);
        expect(result).not.toBeNull();
        expect(result?.wellFormed).toBe(false);
    });

    it('should pass on correct tags', () => {
        const input = '<p>Hello</p>';
        const result = g.parse('element', input);
        expect(result).not.toBeNull();
        expect(result?.wellFormed).toBe(true);
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
