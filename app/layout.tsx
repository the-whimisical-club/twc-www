import type { Metadata } from "next";
import "./globals.css";
import ScrollToTop from "./components/scroll-to-top";

export const metadata: Metadata = {
  title: "the whimsy club",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/lhg5zwj.css" />
      </head>
      <body className="h-full m-0 p-0">
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
