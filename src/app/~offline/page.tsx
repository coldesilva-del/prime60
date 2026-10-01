export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-3xl text-ink">You are offline.</h1>
      <p className="mt-3 max-w-xs text-sm text-ink-soft">
        Prime 60 needs a connection to load this screen. Anything you tapped
        before going offline will be saved when you are back.
      </p>
    </main>
  );
}
