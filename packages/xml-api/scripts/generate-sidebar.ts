import fs from "fs";
import path from "path";

const docsRoot = path.resolve(__dirname, "../docs/api/reference");
const outputFile = path.resolve(
  __dirname,
  "../docs/.vitepress/api-sidebar.json",
);

function getSidebarItems(dir: string, baseLink: string) {
  const items: any[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "README.md") continue;

    const fullPath = path.join(dir, entry.name);
    const linkPath = `${baseLink}/${entry.name.replace(/\.md$/, "")}`;

    if (entry.isDirectory()) {
      // Recursively get items, but flatten structure for certain patterns if desired.
      // For now, simple directory traversal.
      // If directory contains classes/interfaces, we might want to group them.

      // Check if it's a module directory (has README.md or contains classes etc)
      const children = getSidebarItems(fullPath, linkPath);

      // If it's a "classes", "interfaces" etc folder, we just list content
      if (
        [
          "classes",
          "interfaces",
          "enumerations",
          "type-aliases",
          "functions",
        ].includes(entry.name)
      ) {
        items.push(...children);
      } else {
        // It's a module directory (e.g. 'ast', 'dom')
        items.push({
          text: entry.name,
          collapsed: true,
          items: children,
        });
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      items.push({
        text: entry.name.replace(/\.md$/, ""),
        link: linkPath,
      });
    }
  }

  // Sort items: Directories/Groups first, then files? Or alphabetical?
  // Let's sort alphabetically for now
  return items.sort((a, b) => a.text.localeCompare(b.text));
}

// Generate the sidebar structure
// We want the structure:
// - Overview (link to README)
// - Modules...

const sidebar = [
  { text: "Overview", link: "/api/reference/README" },
  ...getSidebarItems(docsRoot, "/api/reference"),
];

fs.writeFileSync(outputFile, JSON.stringify(sidebar, null, 2));
console.log("API Sidebar generated at", outputFile);
