import * as fs from 'fs';
import * as path from 'path';
import { g } from './xml-grammar';
import { convert } from './xml-grammar-converter';
import { XMLElement } from './xml-ast';

try {
  const xmlPath = path.join(__dirname, 'sample_01.xml');
  console.log(`Reading XML file: ${xmlPath}`);
  const xmlContent = fs.readFileSync(xmlPath, 'utf8');
  
  console.log("Parsing XML...");
  const result = g.parse("document", xmlContent);

  if (result) {
    console.log("Parsing successful. Converting to High-Level AST...");
    const ast = convert(result, xmlContent);

    if (ast instanceof XMLElement) {
        console.log("Conversion successful.");
        console.log("--------------------------------------------------");
        console.log(`Root Element: <${ast.tagName}>`);
        console.log(`Attribute 'xml:lang': ${ast.attr('xml:lang')}`);
        
        console.log("\nSearching for <title> elements...");
        const titles = ast.find('title');
        titles.forEach(title => {
            console.log(`Found title: ${title.text()}`);
        });

        console.log("\nSearching for <h2> elements (Section Headers)...");
        const headers = ast.find('h2');
        headers.forEach(h => {
            console.log(`- ${h.text()}`);
        });

        console.log("--------------------------------------------------");
    } else {
        console.log("Result is not an XMLElement (might be raw text).");
        console.log(ast);
    }

  } else {
    console.error("Parsing failed.");
    process.exit(1);
  }
} catch (error) {
  console.error("Error:", (error as Error).message);
  process.exit(1);
}