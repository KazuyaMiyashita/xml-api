import { grammar } from './xml-grammar';
import { Parser } from './parser';

describe('XML Grammar', () => {
    const parser = new Parser(grammar);

    it('should parse valid names', () => {
        expect(parser.parse('validName', 'Name')).not.toBeNull();
        expect(parser.parse('valid_name.123', 'Name')).not.toBeNull();
        expect(parser.parse(':colon', 'Name')).not.toBeNull();
        expect(parser.parse('1invalid', 'Name')).toBeNull();
    });

    it('should parse valid attributes', () => {
        expect(parser.parse('attr="value"', 'Attribute')).not.toBeNull();
        expect(parser.parse("attr='value'", 'Attribute')).not.toBeNull();
        expect(parser.parse('attr = "value"', 'Attribute')).not.toBeNull();
    });

    it('should parse empty element tags', () => {
        expect(parser.parse('<empty />', 'EmptyElemTag')).not.toBeNull();
        expect(parser.parse('<empty attr="val" />', 'EmptyElemTag')).not.toBeNull();
    });

    it('should parse start tags', () => {
        expect(parser.parse('<start>', 'STag')).not.toBeNull();
        expect(parser.parse('<start attr="val">', 'STag')).not.toBeNull();
    });

    it('should parse end tags', () => {
        expect(parser.parse('</end>', 'ETag')).not.toBeNull();
        expect(parser.parse('</end >', 'ETag')).not.toBeNull();
    });

    it('should parse full elements', () => {
        expect(parser.parse('<root></root>', 'element')).not.toBeNull();
        expect(parser.parse('<root>content</root>', 'element')).not.toBeNull();
        expect(parser.parse('<root><child/></root>', 'element')).not.toBeNull();
    });

    it('should validate matching tags', () => {
        const result = parser.parse('<root></root>', 'element');
        expect(result).not.toBeNull();
        expect(result?.wellFormed).toBe(true);

        const badResult = parser.parse('<root></mismatch>', 'element');
        // Depending on implementation, parser might succeed but mark not well-formed, 
        // OR return valid CST structure but with wellFormed: false flag.
        expect(badResult).not.toBeNull();
        expect(badResult?.wellFormed).toBe(false);
    });

    it('should parse comments', () => {
        expect(parser.parse('<!-- comment -->', 'Comment')).not.toBeNull();
        expect(parser.parse('<!-- - - -->', 'Comment')).not.toBeNull();
    });

    it('should parse CDATA sections', () => {
        expect(parser.parse('<![CDATA[ <not xml> ]]>', 'CDSect')).not.toBeNull();
    });
});