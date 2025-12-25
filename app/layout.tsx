import type { Metadata } from "next";
import "./globals.css";
import ScrollToTop from "./components/scroll-to-top";

export const metadata: Metadata = {
  title: "the whimsy club",
  description: "an exclusive, fuck ads and algorithms, cool club.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
  openGraph: {
    title: "the whimsy club",
    description: "an exclusive, fuck ads and algorithms, cool club.",
    images: [
      {
        url: "/meta/banner.png",
        width: 1200,
        height: 630,
        alt: "the whimsy club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "the whimsy club",
    description: "an exclusive, fuck ads and algorithms, cool club.",
    images: ["/meta/banner.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="stylesheet" href="https://use.typekit.net/lhg5zwj.css" />
      </head>
      <body className="h-full m-0 p-0">
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
