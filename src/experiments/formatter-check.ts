import * as fs from "fs";
import * as path from "path";
import { XMLAPI } from "../core/xml-api";
import { Formatter } from "../core/model/formatter";

const xmlPath = path.join(__dirname, "../core/sample_01.xml");
const xmlContent = fs.readFileSync(xmlPath, "utf8");

const api = new XMLAPI(xmlContent);

if (api.ast) {
    const formatter = new Formatter({ indent: "  " });
    const formattedBody = formatter.format(api.ast);
    
    // Manually reconstruct the document with Prolog and Epilog for verification
    const output = 
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<!DOCTYPE html>\n` +
        formattedBody + 
        `\n`;

    console.log("Original length:", xmlContent.length);
    console.log("Formatted length:", output.length);

    if (xmlContent === output) {
        console.log("Perfect Match!");
    } else {
        console.log("Mismatch!");
        // Find first difference
        for (let i = 0; i < Math.max(xmlContent.length, output.length); i++) {
            if (xmlContent[i] !== output[i]) {
                console.log(`Difference at index ${i}:`);
                console.log(`Original: ...${xmlContent.slice(Math.max(0, i-10), i+10).replace(/\n/g, '\\n')}...`);
                console.log(`Formatted: ...${output.slice(Math.max(0, i-10), i+10).replace(/\n/g, '\\n')}...`);
                break;
            }
        }
    }
} else {
    console.error("Parse failed");
}
