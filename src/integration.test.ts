import * as fs from 'fs';
import * as path from 'path';
import { g } from './xml-grammar';

describe('Integration Test', () => {
  it('should parse sample_01.xml successfully', () => {
    const xmlPath = path.join(__dirname, 'sample_01.xml');
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');
    
    // Test the document rule
    const result = g.parse("document", xmlContent);
    
    expect(result).not.toBeNull();
    if (result) {
        expect(result.type).toBe("document");
    }
  });
});
