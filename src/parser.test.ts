import { GrammarBuilder, lit, reg, seq, alt, rep, plus, opt, exc } from './grammar';
import { Parser } from './parser';

describe('Parser Combinators', () => {
  describe('Literal', () => {
    it('should match exact string', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', lit('hello'));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('hello');
      expect(result).not.toBeNull();
      expect(result?.getText('hello')).toBe('hello');
    });

    it('should fail if string does not match', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', lit('hello'));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('world');
      expect(result).toBeNull();
    });
  });

  describe('RegExpMatch', () => {
    it('should match regex pattern', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', reg('[a-z]+'));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('abc');
      expect(result).not.toBeNull();
      expect(result?.getText('abc')).toBe('abc');
    });

    it('should fail if pattern does not match', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', reg('[0-9]+'));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('abc');
      expect(result).toBeNull();
    });
  });

  describe('Sequence', () => {
    it('should match sequence of expressions', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', seq(lit('A'), lit('B')));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('AB');
      expect(result).not.toBeNull();
      expect(result?.children[0].children.length).toBe(2);
    });

    it('should fail if any part fails', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', seq(lit('A'), lit('B')));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('AC');
      expect(result).toBeNull();
    });
  });

  describe('Choice (Alt)', () => {
    it('should match first option', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', alt(lit('A'), lit('B')));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('A');
      expect(result?.getText('A')).toBe('A');
    });

    it('should match second option if first fails', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', alt(lit('A'), lit('B')));
      const parser = new Parser(gb.build());
      
      const result = parser.parse('B');
      expect(result?.getText('B')).toBe('B');
    });
  });

  describe('Repeat (Rep, Plus, Opt)', () => {
    it('rep should match zero or more', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', rep(lit('A')));
      const parser = new Parser(gb.build());
      
      expect(parser.parse('AA')?.children[0].children.length).toBe(2);
      expect(parser.parse('')?.children[0].children.length).toBe(0);
    });

    it('plus should match one or more', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', plus(lit('A')));
      const parser = new Parser(gb.build());
      
      expect(parser.parse('A')?.children.length).toBe(1);
      expect(parser.parse('')).toBeNull();
    });

    it('opt should match zero or one', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', opt(lit('A')));
      const parser = new Parser(gb.build());
      
      expect(parser.parse('A')?.children[0].children.length).toBe(1);
      expect(parser.parse('')?.children[0].children.length).toBe(0);
    });
  });

  describe('Exclusion', () => {
    it('should match A but not if B matches', () => {
      const gb = new GrammarBuilder();
      gb.rule('root', exc(reg('.'), lit('X')));
      const parser = new Parser(gb.build());
      
      expect(parser.parse('Y')?.getText('Y')).toBe('Y');
      expect(parser.parse('X')).toBeNull();
    });
  });
});
