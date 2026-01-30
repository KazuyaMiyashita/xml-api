import { g } from './minimum-grammar';

describe('Minimum Grammar', () => {
    it('should parse simple attributes', () => {
        const xml = '<root id="1" />';
        const result = g.parse("document", xml);
        expect(result).not.toBeNull();
        expect(result?.wellFormed).toBe(true);
    });

    it('should parse simple elements', () => {
        const xml = '<root>content</root>';
        const result = g.parse("document", xml);
        expect(result).not.toBeNull();
        expect(result?.wellFormed).toBe(true);
    });
});