import { SegmentedNav } from "@/components/nav/segmented-nav";

const items = [
  { href: "/progress", label: "Overview" },
  { href: "/progress/health", label: "Health" },
  { href: "/progress/identity", label: "Identity" },
  { href: "/progress/relationships", label: "Relationships" },
];

export function ProgressNav() {
  return <SegmentedNav items={items} ariaLabel="Progress sections" />;
}
