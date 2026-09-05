import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { OfflineBanner } from "@/components/OfflineBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Companion",
  description: "Dementia care companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <ToastProvider>
          <OfflineBanner />
          <main className="flex-grow">{children}</main>
          <footer className="w-full bg-gray-800 text-gray-300 text-center py-4 px-6 text-sm">
            <p className="max-w-4xl mx-auto">
              <strong>Disclaimer:</strong> Life Companion is a support and monitoring tool, not a diagnostic or medical treatment device. Always consult with a healthcare professional for medical advice.
            </p>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
