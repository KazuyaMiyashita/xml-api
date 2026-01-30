import { XMLAPI } from './xml-api';
import { AST } from './xml-ast';
import { grammar as minGrammar } from './minimum-grammar';
import { convert as minConvert } from './minimum-converter';

describe('XMLAPI', () => {
    describe('Default Configuration (Standard XML)', () => {
        it('should parse and convert automatically in constructor', () => {
            const xml = '<root id="1">Text</root>';
            const api = new XMLAPI(xml);

            expect(api.cst).not.toBeNull();
            expect(api.ast).toBeInstanceOf(AST);
            if (api.ast instanceof AST) {
                expect(api.ast.tagName).toBe('root');
                expect(api.ast.attr('id')).toBe('1');
                expect(api.ast.text()).toBe('Text');
            }
        });

        it('should have null ast if xml is not well-formed (mismatched tags)', () => {
            const xml = '<root>text</foo>';
            const api = new XMLAPI(xml);

            expect(api.cst).not.toBeNull();
            // In the new parser implementation, mismatched tags in a choice (like element) might 
            // result in a failed parse for that branch, or if forced, a non-well-formed node.
            // With the current grammar, element -> STag content ETag requires names to match via validator.
            // The validator sets wellFormed = false.
            expect(api.cst?.wellFormed).toBe(false);
            expect(api.ast).toBeNull();
        });

        it('should have null cst if parsing fails completely', () => {
            const xml = 'not xml at all';
            const api = new XMLAPI(xml);

            expect(api.cst).toBeNull();
            expect(api.ast).toBeNull();
        });
    });

    describe('Custom Configuration (Minimum Grammar)', () => {
        it('should accept custom grammar and converter', () => {
            const xml = '<min>Simple</min>';
            const api = new XMLAPI(xml, minGrammar, minConvert);

            expect(api.ast).toBeInstanceOf(AST);
            if (api.ast instanceof AST) {
                expect(api.ast.tagName).toBe('min');
                expect(api.ast.text()).toBe('Simple');
            }
        });
    });
});
