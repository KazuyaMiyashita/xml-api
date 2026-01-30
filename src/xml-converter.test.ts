import { g } from './xml-grammar';
import { convert } from './xml-converter';
import { AST } from './xml-ast';

describe('XML Converter', () => {
    it('should convert a parsed CST to AST', () => {
        const xml = '<root id="1"><child>Text</child></root>';
        const cst = g.parse("document", xml);
        expect(cst).not.toBeNull();
        
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.tagName).toBe('root');
                expect(ast.attr('id')).toBe('1');
                expect(ast.children.length).toBe(1);
                
                const child = ast.children[0];
                expect(child).toBeInstanceOf(AST);
                if (child instanceof AST) {
                    expect(child.tagName).toBe('child');
                    expect(child.text()).toBe('Text');
                }
            }
        }
    });

    it('should handle empty elements', () => {
        const xml = '<root />';
        const cst = g.parse("document", xml);
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.tagName).toBe('root');
                expect(ast.children.length).toBe(0);
            }
        }
    });

    it('should handle character references', () => {
        const xml = '<root>&#65;</root>';
        const cst = g.parse("document", xml);
        if (cst) {
            const ast = convert(cst, xml);
            if (ast instanceof AST) {
                expect(ast.text()).toBe('A');
            }
        }
    });
});