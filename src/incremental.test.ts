import { XMLAPI } from './xml-api';
import { grammar as minGrammar } from './minimum-grammar';
import { convert as minConverter } from './minimum-converter';

describe('XMLAPI.update_input', () => {
  it('should be consistent with full re-parse after updating text', () => {
    const initialXml = '<root><child>hello</child></root>';
    const api = new XMLAPI(initialXml, minGrammar, minConverter);
    
    expect(api.ast).toBeDefined();
    if (api.ast) {
        expect(api.ast.tagName).toBe('root');
        expect(api.ast.children[0]).toMatchObject({ tagName: 'child' });
    }

    // Update "hello" to "world" (pos 13-18)
    api.update_input(13, 18, 'world');

    const expectedXml = '<root><child>world</child></root>';
    expect(api.input).toBe(expectedXml);
    
    const freshApi = new XMLAPI(expectedXml, minGrammar, minConverter);
    expect(api.cst).toEqual(freshApi.cst);
    expect(api.ast).toEqual(freshApi.ast);
  });

  it('should handle tag name changes', () => {
    const initialXml = '<foo></foo>';
    const api = new XMLAPI(initialXml, minGrammar, minConverter);
    
    // Change <foo> to <bar>
    api.update_input(1, 4, 'bar'); // <bar></foo> -> invalid
    expect(api.cst?.wellFormed).toBe(false);
    
    // Change </foo> to </bar>
    api.update_input(7, 10, 'bar'); // <bar></bar> -> valid
    expect(api.cst?.wellFormed).toBe(true);
    if (api.ast) {
        expect(api.ast.tagName).toBe('bar');
    }
  });

  it('should handle attribute updates', () => {
    const initialXml = '<root attr="val" />';
    const api = new XMLAPI(initialXml, minGrammar, minConverter);
    
    // Change "val" to "newval"
    api.update_input(12, 15, 'newval');
    
    if (api.ast) {
        expect(api.ast.attributes['attr']).toBe('newval');
    }
  });
});
