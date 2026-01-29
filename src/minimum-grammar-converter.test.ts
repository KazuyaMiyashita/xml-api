import { g } from './minimum-grammar';
import { convert } from './minimum-grammar-converter';
import { XMLElement } from './xml-ast';

describe('Minimum Grammar Converter', () => {
    it('should convert a simple element to AST', () => {
        const input = '<div id="main">Hello</div>';
        const node = g.parse('document', input);
        expect(node).not.toBeNull();
        
        if (node) {
            const ast = convert(node, input);
            expect(ast).toBeInstanceOf(XMLElement);
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('div');
                expect(ast.attr('id')).toBe('main');
                expect(ast.children.length).toBe(1);
                expect(ast.children[0]).toBe('Hello');
                expect(ast.text()).toBe('Hello');
            }
        }
    });

    it('should convert nested elements', () => {
        const input = '<root><item id="1">A</item><item id="2">B</item></root>';
        const node = g.parse('document', input);
        expect(node).not.toBeNull();

        if (node) {
            const ast = convert(node, input);
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('root');
                expect(ast.children.length).toBe(2);
                
                const items = ast.find('item');
                expect(items.length).toBe(2);
                expect(items[0].attr('id')).toBe('1');
                expect(items[0].text()).toBe('A');
                expect(items[1].attr('id')).toBe('2');
                expect(items[1].text()).toBe('B');
            }
        }
    });

    it('should handle mixed content and text concatenation', () => {
        const input = '<p>Hello <b>World</b>!</p>';
        const node = g.parse('document', input);
        expect(node).not.toBeNull();

        if (node) {
            const ast = convert(node, input);
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('p');
                // children: "Hello ", <b>, "!"
                expect(ast.text()).toBe('Hello World!');
            }
        }
    });
    
    it('should handle attributes with different quotes', () => {
        const input = "<tag single='quote' double=\"quote\" />";
        const node = g.parse('document', input);
        expect(node).not.toBeNull();
        
        if(node) {
            const ast = convert(node, input);
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('tag');
                expect(ast.attr('single')).toBe('quote');
                expect(ast.attr('double')).toBe('quote');
            }
        }
    });
});
