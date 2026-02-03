export interface ElementDefinition {
  name: string;
  isVoid?: boolean;
}

export class XMLSchema {
  private elements: Map<string, ElementDefinition> = new Map();

  constructor(definitions: ElementDefinition[] = []) {
    for (const def of definitions) {
      this.elements.set(def.name, def);
    }
  }

  public isVoid(tagName: string): boolean {
    return this.elements.get(tagName)?.isVoid ?? false;
  }
}
