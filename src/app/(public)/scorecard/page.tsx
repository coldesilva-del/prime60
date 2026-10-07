import type { Metadata } from "next";
import { FOUNDING_PLACES, getFoundingPlacesLeft } from "@/lib/founding";
import { Scorecard } from "./scorecard";

export const metadata: Metadata = {
  title: "The second-half scorecard",
  description:
    "Rate your health, purpose, relationships and identity out of ten. One minute, nothing saved. See which pillar got what was left over.",
};

export default async function ScorecardPage() {
  const left = await getFoundingPlacesLeft();
  const claimLabel =
    left !== null && left > 0 ? `Claim founding place ${FOUNDING_PLACES - left + 1} of ${FOUNDING_PLACES}` : "Create your account";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight text-ink sm:text-4xl">The second-half scorecard</h1>
        <p className="measure text-base text-ink-soft">
          One minute. Rate each of the four pillars out of ten, as they are today, not as you would like them to
          be. Nothing you tap here is saved or sent anywhere.
        </p>
      </div>
      <Scorecard claimLabel={claimLabel} placesLeft={left} />
    </div>
  );
}
