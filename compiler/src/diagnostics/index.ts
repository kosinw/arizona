import chalk from 'chalk';
import invariant from 'invariant';
import { SourceSpan } from '../common/source';
import { DiagnosticCode, diagnosticCodeTable } from './generated';
import { codeFrameColumns } from '@babel/code-frame';
import wrap from 'word-wrap';

export enum DiagnosticLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export type DiagnosticColor = 'cyan' | 'yellow' | 'red';

export function diagnosticLevelToColor(
  level: DiagnosticLevel
): DiagnosticColor {
  switch (level) {
    case DiagnosticLevel.INFO:
      return 'cyan';
    case DiagnosticLevel.WARNING:
      return 'yellow';
    case DiagnosticLevel.ERROR:
      return 'red';
    default:
      invariant(false, 'level must be a valid DiagnosticLevel variant');
  }
}

export class DiagnosticMessage {
  code: DiagnosticCode;
  level: DiagnosticLevel;
  title: string;
  preamble?: string;
  message?: string;
  primarySpan?: SourceSpan;
  secondarySpans: SourceSpan[] = [];

  private constructor(
    code: DiagnosticCode,
    level: DiagnosticLevel,
    ...args: string[]
  ) {
    this.code = code;
    this.level = level;

    const { title, preamble, message } = diagnosticCodeTable[code];

    this.title = title;
    this.preamble = preamble;
    this.message = message;

    for (let i = 0; i < args.length; ++i) {
      this.message?.replaceAll(`${i}`, args[i]);
      this.preamble?.replaceAll(`${i}`, args[i]);
    }
  }

  static create(
    code: DiagnosticCode,
    level: DiagnosticLevel,
    ...args: string[]
  ): DiagnosticMessage {
    return new DiagnosticMessage(code, level, ...args);
  }

  withSpan(span: SourceSpan): DiagnosticMessage {
    this.primarySpan = span;
    return this;
  }
}

// TODO(kosi): Add secdonary span stuff
export function formatDiagnosticMessage(
  msg: DiagnosticMessage,
  withColor: boolean = false
): string {
  const { preamble = '', message = '', title, level, primarySpan = null } = msg;
  const fp = !!primarySpan ? primarySpan.source.filepath : '<text>';
  const color = diagnosticLevelToColor(level);

  const buffer: string[] = [];

  const diagnosticHeader = `-- ${title.toUpperCase()} ---------------------------------------------- ${fp}`;

  const headerLength = diagnosticHeader.length - 1;

  if (withColor) {
    buffer.push(chalk[color](diagnosticHeader));
  } else {
    buffer.push(diagnosticHeader);
  }

  buffer.push('');

  if (!!preamble) {
    buffer.push(wrap(preamble, { width: headerLength, indent: '' }) + '\n');
  }

  if (!!primarySpan) {
    const location = primarySpan.cursor;
    let frame: string = codeFrameColumns(
      primarySpan.source.contents,
      location,
      {
        highlightCode: withColor,
      }
    );

    buffer.push(frame);
  }

  buffer.push('');

  if (!!message) {
    buffer.push(wrap(message, { width: headerLength, indent: '' }) + '\n');
  }

  return buffer.join('\n');
}

export abstract class DiagnosticEmitter {
  diagnostics: DiagnosticMessage[];

  protected constructor(diagnostics: DiagnosticMessage[] = []) {
    this.diagnostics = diagnostics;
  }

  emitDiagnostic(
    code: DiagnosticCode,
    level: DiagnosticLevel,
    primarySpan: SourceSpan | null = null,
    secondarySpans: SourceSpan[] = [],
    ...args: string[]
  ): void {
    let message = DiagnosticMessage.create(code, level, ...args);
    if (!!primarySpan) message = message.withSpan(primarySpan);

    this.diagnostics.push(message);
  }

  error(
    code: DiagnosticCode,
    span: SourceSpan | null = null,
    ...args: string[]
  ): void {
    this.emitDiagnostic(code, DiagnosticLevel.ERROR, span, [], ...args);
  }

  info(
    code: DiagnosticCode,
    span: SourceSpan | null = null,
    ...args: string[]
  ): void {
    this.emitDiagnostic(code, DiagnosticLevel.INFO, span, [], ...args);
  }

  warning(
    code: DiagnosticCode,
    span: SourceSpan | null = null,
    ...args: string[]
  ): void {
    this.emitDiagnostic(code, DiagnosticLevel.WARNING, span, [], ...args);
  }
}
