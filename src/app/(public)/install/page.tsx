import type { Metadata } from "next";
import { InstallFigure } from "./install-figure";

export const metadata: Metadata = { title: "Install on your phone" };

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-medium text-ink"
      >
        {n}
      </span>
      <span className="text-base text-ink">{children}</span>
    </li>
  );
}

export default function InstallPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-ink">Install Prime 60 on your phone</h1>
        <p className="measure text-base text-ink-soft">
          Prime 60 is a web app. Adding it to your home screen gives it an icon, a full screen and a quick
          morning and evening. Nothing to download from an app store.
        </p>
      </div>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-ink">iPhone, in Safari</h2>
        <ol className="space-y-3">
          <Step n={1}>Open prime60.colindesilva.com in Safari. Other browsers on iPhone cannot install it.</Step>
          <Step n={2}>Tap Share, the square with an arrow at the bottom of the screen.</Step>
          <Step n={3}>Scroll down and tap Add to Home Screen.</Step>
          <Step n={4}>Tap Add in the top right. Prime 60 now sits on your home screen.</Step>
        </ol>
        <div className="grid gap-5 sm:grid-cols-3">
          <InstallFigure src="/images/install/ios-1.png" alt="Safari on iPhone with the Share button highlighted" caption="1. Tap Share." />
          <InstallFigure src="/images/install/ios-2.png" alt="The Share sheet with Add to Home Screen highlighted" caption="2. Tap Add to Home Screen." />
          <InstallFigure src="/images/install/ios-3.png" alt="The Add to Home Screen screen with the Add button highlighted" caption="3. Tap Add." />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-ink">Android, in Chrome</h2>
        <ol className="space-y-3">
          <Step n={1}>Open prime60.colindesilva.com in Chrome.</Step>
          <Step n={2}>Tap the menu, the three dots in the top right.</Step>
          <Step n={3}>Tap Install app, or Add to Home screen on older versions, then confirm.</Step>
        </ol>
        <div className="grid gap-5 sm:grid-cols-3">
          <InstallFigure src="/images/install/android-1.png" alt="Chrome on Android with the menu button highlighted" caption="1. Open the menu." />
          <InstallFigure src="/images/install/android-2.png" alt="The Chrome menu with Install app highlighted" caption="2. Tap Install app." />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Good to know</h2>
        <p className="measure text-base text-ink-soft">
          Open Prime 60 from the icon, not the browser, so it stays signed in and opens full screen. The last
          Today you saw is kept for when the signal is poor.
        </p>
        <p className="measure text-base text-ink-soft">
          Notifications are not part of this version. The morning and evening check-ins are anchored to
          habits you already have, not to alerts.
        </p>
      </section>
    </div>
  );
}
