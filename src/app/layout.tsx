import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Suspense } from "react";
import { Toaster } from "sonner";
import WelcomeToast from "@/components/welcome-toast";
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
  title: {
    default: "Togetherly — Social Impact Events",
    template: "%s | Togetherly",
  },
  description:
    "Discover local causes, join community events, and make a difference together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Navbar />
        {children}
        <Footer />
        <Toaster richColors position="top-center" />
        <Suspense fallback={null}>
          <WelcomeToast />
        </Suspense>
      </body>
    </html>
  );
}
