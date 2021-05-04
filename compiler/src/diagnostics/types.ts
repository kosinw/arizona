export interface DiagnosticEntry {
  code: number;
  title: string;
  preamble?: string;
  message?: string;
}

export interface DiagnosticEntryTable {
  [code: number]: DiagnosticEntry;
}