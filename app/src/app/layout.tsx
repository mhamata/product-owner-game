import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthListener } from "@/components/auth/AuthListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRAXIS: Product Owner Game",
  description: "Product-management simulation for PM interview prep and Scrum/PO training.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Boots the auth lifecycle + progress sync once per tab; renders null
            and no-ops when Supabase is unconfigured. Beside children, not
            wrapping them, so the tree stays server-rendered. */}
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
