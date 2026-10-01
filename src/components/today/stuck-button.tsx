import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Always visible on Today, fixed just above the tab bar. */
export function StuckButton() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-5"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 72px)" }}
    >
      <Button
        variant="secondary"
        className="pointer-events-auto shadow-sheet"
        render={<Link href="/today/stuck" />}
      >
        I&apos;m stuck
      </Button>
    </div>
  );
}
