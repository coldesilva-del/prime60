import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { publicEnv } from "@/lib/env";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const description =
  "A five-minute daily system for men 50 to 65 who want their health, their relationships and their direction back. Free for life for the first 100 members.";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  applicationName: "Prime 60",
  title: { default: "Prime 60. Build the man. Build the life.", template: "%s · Prime 60" },
  description,
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "Prime 60",
    title: "Prime 60. Build the man. Build the life.",
    description,
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image", title: "Prime 60. Build the man. Build the life.", description },
  icons: { icon: "/favicon.ico", apple: "/icons/apple-touch-icon.png" },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prime 60",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#141a21" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies the saved theme before first paint so there is no flash.
const themeScript = `
(function(){try{var t=localStorage.getItem('prime60-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrument.variable} ${newsreader.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
