import { Group } from "@/components/layout/section";
import type { MetricRowData } from "@/lib/progress/types";
import { ExplainNumber } from "./explain-sheet";

interface MetricListProps {
  rows: MetricRowData[];
}

/** A grouped surface of tappable metric rows. Each opens "Why this number". */
export function MetricList({ rows }: MetricListProps) {
  return (
    <Group>
      {rows.map((row) => (
        <ExplainNumber key={row.key} label={row.label} value={row.value} word={row.word} explain={row.explain} />
      ))}
    </Group>
  );
}
