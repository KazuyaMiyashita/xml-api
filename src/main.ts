import * as fs from "fs";
import * as path from "path";
import { XMLAPI } from "./xml-api";

try {
  const xmlPath = path.join(__dirname, "sample_01.xml");
  console.log(`Reading XML file: ${xmlPath}`);
  const xmlContent = fs.readFileSync(xmlPath, "utf8");

  const api = new XMLAPI(xmlContent);

  if (api.ast) {
    const ast = api.ast;
    console.log("Parsing and conversion successful.");
    console.log("--------------------------------------------------");
    console.log(`Root Element: <${ast.tagName}>`);
    console.log(`Attribute 'xml:lang': ${ast.attr("xml:lang")}`);

    console.log("\nSearching for <title> elements...");
    const titles = ast.find("title");
    titles.forEach((title) => {
      console.log(`Found title: ${title.text()}`);
    });

    console.log("\nSearching for <h2> elements (Section Headers)...");
    const headers = ast.find("h2");
    headers.forEach((h) => {
      console.log(`- ${h.text()}`);
    });

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
