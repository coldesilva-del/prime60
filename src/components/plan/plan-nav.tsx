import { SegmentedNav } from "@/components/nav/segmented-nav";

const items = [
  { href: "/plan/projects", label: "Projects" },
  { href: "/plan/ideas", label: "Ideas" },
  { href: "/plan/cycle", label: "90 days" },
  { href: "/plan/roadmap", label: "Roadmap" },
];

export function PlanNav() {
  return <SegmentedNav items={items} ariaLabel="Plan sections" />;
}
