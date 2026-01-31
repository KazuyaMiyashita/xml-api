import { JSDOM } from "jsdom";

const xmlString = `<root>
  <child attr1='single'  attr2="double" >  Text with spaces  </child>
  <!-- comment -->
  <empty  />
  <![CDATA[raw data]]>
</root>`;

const dom = new JSDOM(xmlString, { contentType: "text/xml" });
const doc = dom.window.document;

console.log("Original XML:");
console.log(JSON.stringify(xmlString));
console.log("\nSerialized XML (XMLSerializer):");
const serializer = new dom.window.XMLSerializer();
const serialized = serializer.serializeToString(doc);
console.log(JSON.stringify(serialized));

console.log("\nMatch?", xmlString === serialized);

