import { g } from './xml-grammar';

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

describe('XML Grammar Rules', () => {

  describe('Basic Chars', () => {
    it('Char', () => {
      testRule('Char', 'a');
      testRule('Char', 'あ');
      testRule('Char', '\t');
      testRule('Char', '\n');
      testRule('Char', '\r');
      // Surrogate pair (U+1F600 😀)
      testRule('Char', '\uD83D\uDE00'); 
    });
    it('S', () => {
      testRule('S', ' ');
      testRule('S', '\n\t ');
    });
  });

  describe('Names and Tokens', () => {
    it('NameStartChar', () => {
      testRule('NameStartChar', 'A');
      testRule('NameStartChar', ':');
      testRule('NameStartChar', '_');
      testRule('NameStartChar', 'あ'); // Japanese Hiragana/Katakana usually allowed
      // testRule('NameStartChar', '-', false); // Start char cannot be -
      // testRule('NameStartChar', '.', false); // Start char cannot be .
      // testRule('NameStartChar', '0', false); // Start char cannot be digit
    });
    it('NameChar', () => {
      testRule('NameChar', 'A');
      testRule('NameChar', '0');
      testRule('NameChar', '-');
      testRule('NameChar', '.');
      testRule('NameChar', '\u00B7'); // Middle dot
    });
    it('Name', () => {
      testRule('Name', 'foo');
      testRule('Name', '_foo-bar.baz');
      testRule('Name', 'xml:foo');
    });
    it('Names', () => {
      testRule('Names', 'foo bar baz');
    });
    it('Nmtoken', () => {
        testRule('Nmtoken', '123');
        testRule('Nmtoken', '-.-');
    });
    it('Nmtokens', () => {
        testRule('Nmtokens', '123 abc');
    });
  });

  describe('Literals', () => {
    it('EntityValue', () => {
      testRule('EntityValue', '"hello"');
      testRule('EntityValue', "'hello'");
      testRule('EntityValue', '"&#x20;"');
      testRule('EntityValue', '"%pe;"');
      testRule('EntityValue', '"&ge;"');
    });
    it('AttValue', () => {
      testRule('AttValue', '"val"');
      testRule('AttValue', "'val'");
      testRule('AttValue', '"v&lt;al"');
    });
    it('SystemLiteral', () => {
      testRule('SystemLiteral', '"http://example.com"');
      testRule('SystemLiteral', "'file.dtd'");
    });
    it('PubidLiteral', () => {
        testRule('PubidLiteral', '"-//W3C//DTD XHTML 1.0//EN"');
        testRule('PubidLiteral', "'ISO 8879:1986'");
    });
  });

  describe('Character Data and Comments', () => {
    it('CharData', () => {
      testRule('CharData', 'abc');
      testRule('CharData', 'a]b');
      // " ]] >" is not allowed in CharData
    });
    it('Comment', () => {
      testRule('Comment', '<!-- comment -->');
      testRule('Comment', '<!-- - - -->'); // allowed
      testRule('Comment', '<!-- A-B -->');
      // testRule('Comment', '<!-- -- -->', false); // -- not allowed
    });
    it('CDSect', () => {
       testRule('CDSect', '<![CDATA[some data]]>');
       testRule('CDSect', '<![CDATA[<tag> & data]]>');
       testRule('CDSect', '<![CDATA[]]>');
    });
  });

  describe('Processing Instructions', () => {
      it('PI', () => {
          testRule('PI', '<?target data?>');
          testRule('PI', '<?php echo "hi"; ?>');
      });
  });

  describe('Prolog', () => {
      it('XMLDecl', () => {
          testRule('XMLDecl', '<?xml version="1.0"?>');
          testRule('XMLDecl', '<?xml version="1.0" encoding="UTF-8"?>');
          testRule('XMLDecl', '<?xml version="1.0" standalone="yes"?>');
          testRule('XMLDecl', "<?xml version='1.0'?>");
      });
      it('doctypedecl', () => {
          testRule('doctypedecl', '<!DOCTYPE root SYSTEM "dtd">');
          testRule('doctypedecl', '<!DOCTYPE root [ <!ELEMENT root ANY> ]>');
      });
  });

  describe('Elements', () => {
      it('EmptyElemTag', () => {
          testRule('EmptyElemTag', '<br/>');
          testRule('EmptyElemTag', '<img src="a.jpg" />');
      });
      it('STag', () => {
          testRule('STag', '<div>');
          testRule('STag', '<a href="link">');
          testRule('STag', '<foo bar="baz" qux="quux">');
      });
      it('ETag', () => {
          testRule('ETag', '</div>');
          testRule('ETag', '</a>');
      });
      it('element', () => {
          testRule('element', '<br/>');
          testRule('element', '<p>Hello</p>');
          testRule('element', '<div><span>Nested</span></div>');
          testRule('element', '<empty></empty>');
      });

      it('should fail well-formedness on mismatched tags', () => {
          const result = g.parse('element', '<p>Hello</div>');
          expect(result).not.toBeNull();
          expect(result?.wellFormed).toBe(false);
      });

      it('should fail well-formedness on improper nesting', () => {
          const result = g.parse('element', '<div><p>Hello</div></p>');
          expect(result).not.toBeNull();
          expect(result?.wellFormed).toBe(false);
      });

      it('should fail well-formedness on duplicate attributes in STag', () => {
          const result = g.parse('element', '<div id="a" id="b"></div>');
          expect(result).not.toBeNull();
          expect(result?.wellFormed).toBe(false);
      });

      it('should fail well-formedness on duplicate attributes in EmptyElemTag', () => {
          const result = g.parse('element', '<img src="a.jpg" src="b.jpg" />');
          expect(result).not.toBeNull();
          expect(result?.wellFormed).toBe(false);
      });
  });

  describe('References', () => {
      it('CharRef', () => {
          testRule('CharRef', '&#65;');
          testRule('CharRef', '&#x41;');
          testRule('CharRef', '&#x4a;');
          testRule('CharRef', '&#x4F;'); // Uppercase hex
      });
      it('EntityRef', () => {
          testRule('EntityRef', '&amp;');
          testRule('EntityRef', '&lt;');
          testRule('EntityRef', '&myEntity;');
      });
  });

  describe('DTD Declarations', () => {
      it('elementdecl', () => {
          testRule('elementdecl', '<!ELEMENT br EMPTY>');
          testRule('elementdecl', '<!ELEMENT p (#PCDATA|b)*>');
          testRule('elementdecl', '<!ELEMENT container ANY>');
          testRule('elementdecl', '<!ELEMENT div (p+)>');
      });
      it('AttlistDecl', () => {
          testRule('AttlistDecl', '<!ATTLIST p id ID #IMPLIED>');
          testRule('AttlistDecl', '<!ATTLIST img src CDATA #REQUIRED>');
      });
      it('EntityDecl', () => {
          testRule('EntityDecl', '<!ENTITY foo "bar">');
          testRule('EntityDecl', '<!ENTITY % pe "val">');
          testRule('EntityDecl', '<!ENTITY ext SYSTEM "http://example.com">');
      });
      it('NotationDecl', () => {
          testRule('NotationDecl', '<!NOTATION jpeg SYSTEM "image/jpeg">');
          testRule('NotationDecl', '<!NOTATION png PUBLIC "PNG 1.0">');
      });
  });

  describe('Conditional Sections', () => {
    it('includeSect', () => {
        testRule('includeSect', '<![INCLUDE[ <!ELEMENT foo EMPTY> ]]>');
    });
    it('ignoreSect', () => {
        testRule('ignoreSect', '<![IGNORE[ something ]]>');
        testRule('ignoreSect', '<![IGNORE[ <![something]]> ]]>');
    });
  });

  // Integration-like test for document
  describe('Document', () => {
      it('should parse a simple document', () => {
          const doc = '<?xml version="1.0"?><root>text</root>';
          testRule('document', doc);
      });
      it('should parse document with DTD', () => {
          const doc = '<?xml version="1.0"?><!DOCTYPE root SYSTEM "foo.dtd"><root/>';
          testRule('document', doc);
      });
  });

});