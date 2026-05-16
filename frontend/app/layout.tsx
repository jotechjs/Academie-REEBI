import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export const metadata: Metadata = {
  metadataBase: new URL("https://reebi-academie.com"),
  title: {
    default: "REEBI - Plateforme Académique",
    template: "%s | REEBI",
  },
  description: "Plateforme académique REEBI - Gestion des académiciens, sessions, présences et attestations de l'Académie REEBI.",
  keywords: ["REEBI", "Académie", "Formation", "Gestion académiciens", "Attestation", "Présence"],
  authors: [{ name: "REEBI Academy" }],
  creator: "REEBI",
  publisher: "REEBI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://reebi-academie.com",
    siteName: "REEBI - Plateforme Académique",
    title: "REEBI - Plateforme Académique",
    description: "Plateforme académique REEBI - Gestion des académiciens, sessions, présences et attestations.",
    images: [
      {
        url: "/logo-REEBI.png",
        width: 512,
        height: 512,
        alt: "Logo REEBI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "REEBI - Plateforme Académique",
    description: "Plateforme académique REEBI - Gestion des académiciens, sessions, présences et attestations.",
    images: ["/logo-REEBI.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-slate-50">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
