import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreeTable - Restaurant Booking Platform",
  description: "Book tables at your favorite restaurants with ease. Find, reserve, and enjoy dining experiences with FreeTable.",
  keywords: "restaurant booking, table reservation, dining, food, restaurants",
  authors: [{ name: "FreeTable" }],
  creator: "FreeTable",
  publisher: "FreeTable",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://free-table.gyurmatag.workers.dev"),
  openGraph: {
    title: "FreeTable - Restaurant Booking Platform",
    description: "Book tables at your favorite restaurants with ease. Find, reserve, and enjoy dining experiences with FreeTable.",
    url: "https://free-table.gyurmatag.workers.dev",
    siteName: "FreeTable",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeTable - Restaurant Booking Platform",
    description: "Book tables at your favorite restaurants with ease. Find, reserve, and enjoy dining experiences with FreeTable.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
