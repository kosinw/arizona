import { describe, it, expect } from '@jest/globals';
import dedent from 'dedent';
import { generateSymbolTable } from '..';
import { GlobalSymbolTable } from '../types';
import { parse } from '../../parser/index';
import * as util from 'util';
import { SyntaxNativeType } from '../../parser/types';

const gentab = (src: string): GlobalSymbolTable => {
  return generateSymbolTable(parse(src));
};

describe('symbol table generation tests', () => {
  it('generates entries for global (mutable and immutable) variables', () => {
    const src = dedent`
        let big: i32 = 15;
        const small: f32 = 1.2345;
    `;

    const table = gentab(src);

    expect(table.symbols['big'].immutable).toEqual(false);
    expect(table.symbols['small'].immutable).toEqual(true);
  });

  it('generates entries for functions with parameters', () => {
    const src = dedent`
        fn foo(x: i32, y: f32) {}
    `;

    const table = gentab(src);

    expect(table.functions['foo'].returnValue?.staticType).toEqual(
      SyntaxNativeType.Void
    );
    expect(table.functions['foo'].symbols['x'].staticType).toEqual(
      SyntaxNativeType.I32
    );
  });

  it('generates local variables propely', () => {
    const src = dedent`
        fn foo(x: i32, y: f32) {
            const skips: i32 = 15;
            let phaps: i32 = 'p';
        }
    `;

    const table = gentab(src);

    expect(
      table.functions['foo'].blocks[0].symbols['skips'].staticType
    ).toEqual(SyntaxNativeType.I32);
    expect(table.functions['foo'].blocks[0].symbols['phaps'].immutable).toEqual(
      false
    );
  });

  it('generates multiple functions properly', () => {
    const src = dedent`
        const global: i32 = 21;

        fn foo(x: i32, y: f32) {
            const skips: i32 = 15;
            let phaps: i32 = 'p';
        }

        fn bar() -> f32 {
            let skips: f32 = 0.45;
        }
    `;

    const table = gentab(src);

    expect(Object.keys(table.functions['foo'].symbols).length).toEqual(2);
    expect(Object.keys(table.functions['bar'].symbols).length).toEqual(0);
    expect(table.functions['bar'].blocks[0].symbols['skips']).toBeDefined();
  });

  it('works properly with imports and exports', () => {
    const src = dedent`
        export const global: i32 = 21;

        use fn println(x: i32) -> void from "env";

        export fn foo(x: i32, y: f32) {
            for (let i: i32 = 0; i < 15; i += 1) {
                println(counter);
            }
        }
    `;

    const table = gentab(src);

    expect(table.imports).toHaveProperty('println');
    expect(table.exports).toHaveProperty('global');
    expect(table.exports).toHaveProperty('foo');
  });

  it('throws when same function is defined twice', () => {
    const src = dedent`
        const global: i32 = 21;

        fn foo(x: i32, y: f32) {
            const skips: i32 = 15;
            let phaps: i32 = 'p';
        }

        fn foo() -> f32 {
            let skips: f32 = 0.45;
        }
    `;

    expect(() => gentab(src)).toThrow();
  });

  it('can handle nested blocks properly', () => {
    const src = dedent`
        export fn foo(x: i32, y: f32) {
          // let x: i64 = 3;
          {
            let x: i32 = 15;
            {
              const x: f32 = 3.24;
            }
          }
        }
    `;

    const table = gentab(src);

    console.log(util.inspect(table, { depth: null }));
  });

  it('throws when same variable is defined twice in same scope', () => {
    const src = dedent`
        const global: i32 = 21;

        fn foo(x: i32, y: f32) {
            const skips: i32 = 15;
            let skips: i32 = 'p';
        }
    `;

    expect(() => gentab(src)).toThrow();
  });
});
