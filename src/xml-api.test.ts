import { XMLAPI } from './xml-api';
import { AST } from './xml-ast';
import { g as minGrammar } from './minimum-grammar';
import { convert as minConvert } from './minimum-converter';

describe('XMLAPI', () => {
    describe('Default Configuration (Standard XML)', () => {
        it('should parse and convert using default grammar and converter', () => {
            const xml = '<root id="1">Text</root>';
            const api = new XMLAPI(xml);
            const ast = api.generateAST();

            expect(ast).toBeInstanceOf(AST);
            expect(ast.tagName).toBe('root');
            expect(ast.attr('id')).toBe('1');
            expect(ast.text()).toBe('Text');
        });
    });

    describe('Custom Configuration (Minimum Grammar)', () => {
        it('should accept custom grammar and converter', () => {
            const xml = '<min>Simple</min>';
            // Inject minimum grammar and minimum converter
            const api = new XMLAPI(xml, minGrammar, minConvert);
            const ast = api.generateAST();

            expect(ast).toBeInstanceOf(AST);
            expect(ast.tagName).toBe('min');
            expect(ast.text()).toBe('Simple');
        });
    });
});
