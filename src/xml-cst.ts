export class CST {
  constructor(
    public type: string,
    public start: number,
    public end: number,
    public children: CST[] = [],
    public wellFormed: boolean = true
  ) {}

  getText(input: string): string {
    return input.slice(this.start, this.end);
  }
}
