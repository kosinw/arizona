import { describe, it, expect } from '@jest/globals';
import dedent from 'dedent';
import { SourceFile } from '../../common/source';
import * as diagnostics from '../index';
import { DiagnosticCode } from '../generated';

describe('diagnostics/index.ts', () => {
  const code = dedent`
    fn meaning_of_life() -> i32 {
        return 42;
    }
  `;

  it('generates message (without) color properly', () => {
    const source = new SourceFile(code, 'test/unknown.az');

    const offender = source.span(code.indexOf('return'), code.indexOf(';'));

    const diagnostic = diagnostics.DiagnosticMessage.create(
      DiagnosticCode.DUMMY_ERROR,
      diagnostics.DiagnosticLevel.ERROR
    ).withSpan(offender);

    const m = diagnostics.formatDiagnosticMessage(diagnostic, false);

    expect(m).toMatchInlineSnapshot(`
      "-- DUMMY ERROR ---------------------------------------------- test/unknown.az

      This error is just a placeholder and should not actually be used in code.

        1 | fn meaning_of_life() -> i32 {
      > 2 |     return 42;
          |     ^^^^^^^^^
        3 | }

      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam tempor, leo 
      quis dapibus varius, sapien nunc pellentesque ex, vel sollicitudin massa 
      velit nec quam. Nunc neque magna, dictum et tellus imperdiet, tempor 
      dignissim risus. Sed tempus convallis ipsum, non lacinia nisi volutpat vel.
      "
    `);
  });

  it('generates message (with) color properly', () => {
    const source = new SourceFile(code, 'test/unknown.az');

    const offender = source.span(code.indexOf('return'), code.indexOf(';'));

    const diagnostic = diagnostics.DiagnosticMessage.create(
      DiagnosticCode.DUMMY_ERROR,
      diagnostics.DiagnosticLevel.ERROR
    ).withSpan(offender);

    const m = diagnostics.formatDiagnosticMessage(diagnostic, true);

    expect(m).toMatchInlineSnapshot(`
      "[31m-- DUMMY ERROR ---------------------------------------------- test/unknown.az[39m

      This error is just a placeholder and should not actually be used in code.

      [0m [90m 1 |[39m fn meaning_of_life() [33m-[39m[33m>[39m i32 {[0m
      [0m[31m[1m>[22m[39m[90m 2 |[39m     [36mreturn[39m [35m42[39m[33m;[39m[0m
      [0m [90m   |[39m     [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[0m
      [0m [90m 3 |[39m }[0m

      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam tempor, leo 
      quis dapibus varius, sapien nunc pellentesque ex, vel sollicitudin massa 
      velit nec quam. Nunc neque magna, dictum et tellus imperdiet, tempor 
      dignissim risus. Sed tempus convallis ipsum, non lacinia nisi volutpat vel.
      "
    `);
  });
});
