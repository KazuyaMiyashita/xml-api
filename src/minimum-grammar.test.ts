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
