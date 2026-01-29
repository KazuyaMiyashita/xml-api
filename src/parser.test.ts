import { Grammar } from './parser';

describe('Parser Combinators', () => {
  const g = new Grammar();

  describe('Literal', () => {
    it('should match exact string', () => {
      const parser = g.lit('hello');
      const ctx = { input: 'hello world', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result).not.toBeNull();
      expect(result?.getText(ctx.input)).toBe('hello');
      expect(ctx.pos).toBe(5);
    });

    it('should fail if string does not match', () => {
      const parser = g.lit('hello');
      const ctx = { input: 'world', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result).toBeNull();
      expect(ctx.pos).toBe(0);
    });
  });

  describe('RegExpMatch', () => {
    it('should match regex pattern', () => {
      const parser = g.reg('[a-z]+');
      const ctx = { input: 'abc123', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result).not.toBeNull();
      expect(result?.getText(ctx.input)).toBe('abc');
      expect(ctx.pos).toBe(3);
    });

    it('should fail if pattern does not match', () => {
      const parser = g.reg('[0-9]+');
      const ctx = { input: 'abc', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result).toBeNull();
      expect(ctx.pos).toBe(0);
    });
  });

  describe('Sequence', () => {
    it('should match sequence of expressions', () => {
      const parser = g.seq(g.lit('A'), g.lit('B'));
      const ctx = { input: 'AB', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result).not.toBeNull();
      expect(result?.getText(ctx.input)).toBe('AB');
      expect(result?.children.length).toBe(2);
      expect(ctx.pos).toBe(2);
    });

    it('should fail if any part fails', () => {
      const parser = g.seq(g.lit('A'), g.lit('B'));
      const ctx = { input: 'AC', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result).toBeNull();
      expect(ctx.pos).toBe(0); // Should backtrack
    });
  });

  describe('Choice (Alt)', () => {
    it('should match first option', () => {
      const parser = g.alt(g.lit('A'), g.lit('B'));
      const ctx = { input: 'A', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result?.getText(ctx.input)).toBe('A');
    });

    it('should match second option if first fails', () => {
      const parser = g.alt(g.lit('A'), g.lit('B'));
      const ctx = { input: 'B', pos: 0, rules: {}, tags: [], validators: {} };
      const result = parser.execute(ctx);
      expect(result?.getText(ctx.input)).toBe('B');
    });
  });

  describe('Repeat (Rep, Plus, Opt)', () => {
    it('rep should match zero or more', () => {
      const parser = g.rep(g.lit('A'));
      // Match 2
      let ctx = { input: 'AA', pos: 0, rules: {}, tags: [], validators: {} };
      let result = parser.execute(ctx);
      expect(result?.children.length).toBe(2);
      
      // Match 0
      ctx = { input: 'B', pos: 0, rules: {}, tags: [], validators: {} };
      result = parser.execute(ctx);
      expect(result?.children.length).toBe(0); // Success with empty match
      expect(ctx.pos).toBe(0);
    });

    it('plus should match one or more', () => {
      const parser = g.plus(g.lit('A'));
      // Match 1
      let ctx = { input: 'A', pos: 0, rules: {}, tags: [], validators: {} };
      let result = parser.execute(ctx);
      expect(result?.children.length).toBe(1);

      ctx = { input: 'B', pos: 0, rules: {}, tags: [], validators: {} };
      result = parser.execute(ctx);
      expect(result).toBeNull();
    });

    it('opt should match zero or one', () => {
        const parser = g.opt(g.lit('A'));
        // Match 1
        let ctx = { input: 'A', pos: 0, rules: {}, tags: [], validators: {} };
        let result = parser.execute(ctx);
        expect(result?.children.length).toBe(1);
  
        // Match 0
        ctx = { input: 'B', pos: 0, rules: {}, tags: [], validators: {} };
        result = parser.execute(ctx);
        expect(result?.children.length).toBe(0);
    });
  });

  describe('Exclusion', () => {
      it('should match A but not if B matches', () => {
          // A = any char, B = "X"
          // This exclusion combinator implementation is specific:
          // It executes A. If A succeeds, it checks if B matches at the ORIGINAL position.
          // If B matches and its length >= A's length, it fails.
          // This is useful for "Match anything except ']]>'" logic.
          
          const parser = g.exc(g.reg('.'), g.lit('X'));
          
          // Input 'Y' -> A matches 'Y', B fails. Result 'Y'.
          let ctx = { input: 'Y', pos: 0, rules: {}, tags: [], validators: {} };
          let result = parser.execute(ctx);
          expect(result?.getText(ctx.input)).toBe('Y');

          // Input 'X' -> A matches 'X', B matches 'X'. Len A (1) <= Len B (1). Fail.
          ctx = { input: 'X', pos: 0, rules: {}, tags: [], validators: {} };
          result = parser.execute(ctx);
          expect(result).toBeNull();
      });
  });
});
