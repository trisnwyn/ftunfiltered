import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "FTUnfiltered — Feelings. Thoughts. Unfiltered.",
  description:
    "A safe, anonymous space for the FTU community to share confessions, letters, shoutouts, and rants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${lora.variable}`}>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            {children}
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
