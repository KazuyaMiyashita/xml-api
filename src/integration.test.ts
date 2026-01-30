import { grammar } from './xml-grammar';
import { Parser } from './parser';
import { convert } from './xml-converter';
import { AST } from './xml-ast';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Test', () => {
    it('should parse and convert sample_01.xml correctly', () => {
        const xmlPath = path.join(__dirname, 'sample_01.xml');
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');

        const parser = new Parser(grammar);
        const cst = parser.parse(xmlContent);
        
        expect(cst).not.toBeNull();
        expect(cst?.wellFormed).toBe(true);

        if (cst) {
            const ast = convert(cst, xmlContent);
            expect(ast).toBeInstanceOf(AST);
            
            if (ast instanceof AST) {
                expect(ast.tagName).toBe('html');
                expect(ast.attr('xml:lang')).toBe('ja');
                
                const titles = ast.find('title');
                expect(titles.length).toBeGreaterThan(0);
                expect(titles[0].text()).toBe('りんごの選び方');
            }
        }
    });
});
