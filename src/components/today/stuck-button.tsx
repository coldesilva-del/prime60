import { ButtonLink } from "@/components/ui/button";

/**
 * Always visible on Today, fixed just above the tab bar at the left, mirroring
 * the quick-actions button at the right.
 */
export function StuckButton() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[520px] justify-start px-5"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 72px)" }}
    >
      <ButtonLink href="/today/stuck" variant="secondary" size="lg" className="pointer-events-auto shadow-sheet">
        I&apos;m stuck
      </ButtonLink>
    </div>
  );
}
