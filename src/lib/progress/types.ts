/** Serialisable shapes shared between server queries and client components. */

export interface ExplainInput {
  label: string;
  value: string;
}

/** The contents of a "Why this number" sheet: inputs first, then the arithmetic. */
export interface Explain {
  /** The number as shown in the row. */
  value: string;
  inputs: ExplainInput[];
  arithmetic: string[];
  /** One quiet sentence about method or limits, when needed. */
  note?: string;
}

export interface MetricRowData {
  key: string;
  label: string;
  value: string;
  /** "fewer", "more", "steady" or a short qualifier. Never a colour. */
  word?: string;
  explain: Explain;
}
