import * as fs from 'fs';
import * as path from 'path';
import { g } from './xml-grammar';

try {
  const xmlPath = path.join(__dirname, 'sample_01.xml');
  const xmlContent = fs.readFileSync(xmlPath, 'utf8');
  const result = g.parse("document", xmlContent);

  if (result) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error("Parsing failed.");
    process.exit(1);
  }
} catch (error) {
  console.error("Error:", (error as Error).message);
  process.exit(1);
}