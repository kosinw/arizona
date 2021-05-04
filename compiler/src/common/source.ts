import invariant from 'invariant';
import lineColumn from 'line-column';

export interface LineColumn {
  line: number;
  column: number;
}

export interface LineColumnSpan {
  start: LineColumn;
  end: LineColumn;
}

export class SourceSpan {
  constructor(
    public start: number,
    public end: number,
    public source: SourceFile
  ) {
    invariant(
      start >= 0,
      'start of span cannot be earlier than first character'
    );
    invariant(start < end, 'start of span must come before end');
    invariant(
      end <= source.length,
      'end of span cannot be past source file length'
    );
  }

  get length() {
    return this.end - this.start;
  }

  getLineColumnFromIndex(idx: number): LineColumn {
    const { line, col } = lineColumn(this.source.contents).fromIndex(idx)!;

    return { line, column: col };
  }

  get cursor(): LineColumnSpan {
    return {
      start: this.getLineColumnFromIndex(this.start),
      end: this.getLineColumnFromIndex(this.end),
    };
  }

  combine(other: SourceSpan): SourceSpan {
    invariant(
      this.source === other.source,
      'both spans must have to same original source file'
    );

    const start = Math.min(this.start, other.start);
    const end = Math.max(this.end, other.end);

    return new SourceSpan(start, end, this.source);
  }

  static join(...spans: SourceSpan[]): SourceSpan {
    let combined = spans.pop();

    invariant(
      !!combined,
      'at least first span provided must not be null/undefined'
    );

    for (let span of spans) {
      combined = combined?.combine(span);
    }

    return combined;
  }
}

export class SourceFile {
  constructor(public contents: string, public filepath: string) {}

  span(start: number, end: number) {
    return new SourceSpan(start, end, this);
  }

  get length() {
    return this.contents.length;
  }
}
