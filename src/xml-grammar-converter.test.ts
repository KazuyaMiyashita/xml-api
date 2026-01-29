import { g } from './xml-grammar';
import { convert } from './xml-grammar-converter';
import { XMLElement } from './xml-ast';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('XML Grammar Converter', () => {
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
                expect(ast.text()).toBe('Hello');
            }
        }
    });

    it('should convert nested elements with mixed content', () => {
        const input = '<p>Hello <b>World</b>!</p>';
        const node = g.parse('document', input);
        expect(node).not.toBeNull();

        if (node) {
            const ast = convert(node, input);
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('p');
                expect(ast.children.length).toBe(3); // "Hello ", <b>, "!"
                expect(ast.text()).toBe('Hello World!');
            }
        }
    });

    it('should handle CDATA sections', () => {
        const input = '<msg><![CDATA[<sender>John</sender>]]></msg>';
        const node = g.parse('document', input);
        expect(node).not.toBeNull();

        if (node) {
            const ast = convert(node, input);
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('msg');
                expect(ast.text()).toBe('<sender>John</sender>');
            }
        }
    });

    it('should decode Character References', () => {
        // &#65; is 'A', &#x42; is 'B'
        const input = '<text>&#65; and &#x42;</text>';
        const node = g.parse('document', input);
        expect(node).not.toBeNull();
        
        if (node) {
            const ast = convert(node, input);
            if (ast instanceof XMLElement) {
                expect(ast.text()).toBe('A and B');
            }
        }
    });

    it('should ignore Comments', () => {
        const input = '<root><!-- This is a comment --><child/></root>';
        const node = g.parse('document', input);
        expect(node).not.toBeNull();

        if (node) {
            const ast = convert(node, input);
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('root');
                expect(ast.children.length).toBe(1); // Only <child/>
                const child = ast.children[0];
                if (child instanceof XMLElement) {
                    expect(child.tagName).toBe('child');
                }
            }
        }
    });

    it('should parse and convert sample_01.xml', () => {
        const filePath = join(__dirname, 'sample_01.xml');
        const input = readFileSync(filePath, 'utf-8');
        
        const node = g.parse('document', input);
        expect(node).not.toBeNull();
        
        if (node) {
            const ast = convert(node, input);
            expect(ast).toBeInstanceOf(XMLElement);
            
            if (ast instanceof XMLElement) {
                expect(ast.tagName).toBe('html');
                expect(ast.attr('xml:lang')).toBe('ja');
                
                const title = ast.find('title')[0];
                expect(title).toBeDefined();
                expect(title.text()).toBe('りんごの選び方');
                
                const sections = ast.find('section');
                expect(sections.length).toBe(2);
                
                const h2s = ast.find('h2');
                expect(h2s.map(h => h.text())).toEqual(['はじめに', '選定基準']);
            }
        }
    });
});
