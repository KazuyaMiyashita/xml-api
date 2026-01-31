import * as fs from "fs";
import * as path from "path";
import { XMLAPI } from "./core/xml-api";
import { Formatter } from "./core/model/formatter";

try {
  const xmlPath = path.join(__dirname, "core/sample_01.xml");
  console.log(`Reading XML file: ${xmlPath}`);
  const xmlContent = fs.readFileSync(xmlPath, "utf8");

  // 1. Initialize XMLAPI (Parsing & CST->AST Conversion)
  const api = new XMLAPI(xmlContent);

  if (api.ast) {
    const ast = api.ast;
    console.log("Parsing and conversion successful.");
    console.log("--------------------------------------------------");
    console.log(`Root Element: <${ast.tagName}>`);
    console.log(`Attribute 'xml:lang': ${ast.attr("xml:lang")}`);

    console.log("\n[Search Demo]");
    const titles = ast.find("title");
    titles.forEach((title) => {
      console.log(`Found title: ${title.text()}`);
      
      // 2. Enhanced AST Demo (CST Mapping)
      if (title.cst) {
        console.log(`  -> Source location: start=${title.cst.start}, end=${title.cst.end}`);
      }
    });

    console.log("\n[Incremental Update Demo]");
    // Find the position of the first title content to replace it
    // Original: <title>りんごの選び方</title>
    const firstTitle = titles[0];
    // We want to replace the text content. 
    // For simplicity in this demo, we'll search string index, 
    // but in a real app we'd use cst information or selection.
    const targetText = "りんごの選び方";
    const startPos = api.input.indexOf(targetText);
    
    if (startPos !== -1) {
      const newText = "美味しいりんごの見分け方";
      console.log(`Updating "${targetText}" -> "${newText}"...`);
      
      // Perform incremental update
      api.updateInput(startPos, startPos + targetText.length, newText);
      
      // Verify AST update
      const newTitles = api.ast.find("title");
      console.log(`Updated title: ${newTitles[0].text()}`);
      
      // Verify root identity (Differential Update check)
      console.log(`Root AST object preserved: ${api.ast === ast}`);
    }

    console.log("\n[Formatter Demo]");
    const formatter = new Formatter({ indent: "  " });
    const formatted = formatter.format(api.ast);
    console.log("Formatted Output (first 200 chars):");
    console.log(formatted.slice(0, 200) + "...");
    
    console.log("--------------------------------------------------");
  } else {
    console.error("Failed to parse or convert XML. Is it well-formed?");
    if (api.cst && !api.cst.wellFormed) {
      console.error("The document is not well-formed.");
    }
    process.exit(1);
  }
} catch (error) {
  console.error("Error:", (error as Error).message);
  process.exit(1);
}
