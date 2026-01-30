import { grammar } from './xml-grammar';
import { Parser } from './parser';
import { convert } from './xml-converter';
import { AST } from './xml-ast';

describe('XML Converter', () => {
    const parser = new Parser(grammar);

    it('should convert simple element', () => {
        const xml = '<root>text</root>';
        const cst = parser.parse(xml, 'element');
        expect(cst).not.toBeNull();
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.tagName).toBe('root');
                expect(ast.text()).toBe('text');
            }
        }
    });

    it('should convert attributes', () => {
        const xml = '<item id="1" type="test" />';
        const cst = parser.parse(xml, 'element');
        expect(cst).not.toBeNull();
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.tagName).toBe('item');
                expect(ast.attr('id')).toBe('1');
                expect(ast.attr('type')).toBe('test');
            }
        }
    });

    it('should handle nested elements', () => {
        const xml = '<parent><child>1</child><child>2</child></parent>';
        const cst = parser.parse(xml, 'element');
        expect(cst).not.toBeNull();
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.tagName).toBe('parent');
                expect(ast.children.length).toBe(2);
                expect(ast.find('child').length).toBe(2);
            }
        }
    });

    it('should handle CDATA', () => {
        const xml = '<data><![CDATA[<raw>]]></data>';
        const cst = parser.parse(xml, 'element');
        expect(cst).not.toBeNull();
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.text()).toBe('<raw>');
            }
        }
    });

    it('should resolve character references', () => {
        const xml = '<char>&#65;&#x42;</char>';
        const cst = parser.parse(xml, 'element');
        expect(cst).not.toBeNull();
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.text()).toBe('AB');
            }
        }
    });
});
