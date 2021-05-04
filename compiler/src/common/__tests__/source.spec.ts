import { describe, it } from '@jest/globals';
import { SourceFile, SourceSpan } from '../source';
import dedent from 'dedent';

describe('SourceSpan', () => {
  const code = dedent`
        fn do_constant(j: i32) -> i32 {
            let i: i32 = 42;
            return i + j;
        }
    `;

  let src: SourceFile;

  beforeAll(() => {
    src = new SourceFile(code, 'unknown.az');
  });

  it('create spans properly', () => {
    const span1 = src.span(0, 15);
    const span2 = src.span(16, 18);

    expect(span1.length).toBe(15);
    expect(span2.length).toBe(2);
  });

  it("doesn't allow poorly formed spans", () => {
    expect(() => src.span(-1, 2)).toThrow();
    expect(() => src.span(2, 0)).toThrow();
    expect(() => src.span(0, 9999)).toThrow();
  });

  it('merges spans correctly', () => {
    const a = src.span(0, 15);
    const b = src.span(17, 20);

    const resultant = a.combine(b);

    expect(resultant.end).toEqual(b.end);
    expect(resultant.start).toEqual(a.start);
  });

  it('merges multiple spans correctly', () => {
    const spans = [
      [0, 15],
      [17, 20],
      [2, 3],
      [4, 5],
    ].map((pair) => src.span(pair[0], pair[1]));

    const resultant = SourceSpan.join(...spans);

    expect(resultant).toMatchInlineSnapshot(`
      SourceSpan {
        "end": 20,
        "source": SourceFile {
          "contents": "fn do_constant(j: i32) -> i32 {
          let i: i32 = 42;
          return i + j;
      }",
          "filepath": "unknown.az",
        },
        "start": 0,
      }
    `);
  });
});
