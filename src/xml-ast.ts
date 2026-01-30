export class AST {
    constructor(
        public tagName: string,
        public attributes: { [key: string]: string } = {},
        public children: (AST | string)[] = []
    ) {}

    // Get attribute value by name
    attr(name: string): string | undefined {
        return this.attributes[name];
    }

    // Get all text content from children, concatenated
    text(): string {
        return this.children.map(c => {
            if (typeof c === 'string') return c;
            return c.text();
        }).join('');
    }

    // Find all descendant elements with the given tag name (simple XPath-like)
    find(tagName: string): AST[] {
        let results: AST[] = [];
        for (const child of this.children) {
            if (child instanceof AST) {
                if (child.tagName === tagName) {
                    results.push(child);
                }
                results = results.concat(child.find(tagName));
            }
        }
        return results;
    }
}
