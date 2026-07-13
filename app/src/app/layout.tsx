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

/**
 * Sets `data-theme` on <html> from the persisted ThemeToggle choice BEFORE
 * React hydrates, so a "dark" or "light" pick never flashes the wrong palette
 * on first paint. Deliberately a raw inline script (not `next/script`, which
 * only runs after/alongside hydration) — this must execute synchronously
 * while the HTML is still parsing, as the very first thing in <body>.
 *
 * Reads the SAME localStorage key ThemeToggle writes to. "system" (or no
 * stored choice) sets nothing, so `prefers-color-scheme` in globals.css
 * decides — matching ThemeToggle's own runtime behavior exactly.
 */
const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('praxis-theme-v1');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The boot script below sets data-theme before hydration, which by
      // definition differs from the server-rendered markup (which never sets
      // it). That is expected and safe here (an attribute only, not content).
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* Boots the auth lifecycle + progress sync once per tab; renders null
            and no-ops when Supabase is unconfigured. Beside children, not
            wrapping them, so the tree stays server-rendered. */}
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
