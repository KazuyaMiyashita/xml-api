import { g } from './minimum-grammar';
import { convert } from './minimum-converter';
import { AST } from './xml-ast';

describe('Minimum Grammar Converter', () => {
    it('should convert CST to AST', () => {
        const xml = '<root id="1"><child>Text</child></root>';
        const cst = g.parse("document", xml);
        expect(cst).not.toBeNull();
        
        if (cst) {
            const ast = convert(cst, xml);
            expect(ast).toBeInstanceOf(AST);
            if (ast instanceof AST) {
                expect(ast.tagName).toBe('root');
                expect(ast.attr('id')).toBe('1');
                
                // Note: minimum-grammar converter logic might be slightly different
                // let's assume it works similarly for this basic case
                expect(ast.children.length).toBe(1);
            }
        }
    });
});