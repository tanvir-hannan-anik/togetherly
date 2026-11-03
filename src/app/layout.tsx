import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/HomePage/Navbar";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import { Suspense } from "react";
import { Loading } from "@/components/Feedback";
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
  title: { default: "Togetherly — Social Impact Events", template: "%s | Togetherly" },
  description: "Discover local causes, join community events, and make a difference together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Suspense fallback={<div className="container nav-bar" aria-label="Loading navigation" />}>
          <Navbar />
        </Suspense>
        <Suspense fallback={<main id="main-content"><Loading /></main>}>
          {children}
        </Suspense>
        <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
