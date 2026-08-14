import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

// Jakarta for UI, Geist Mono for every number that has to line up. The pairing
// is the identity — a geometric sans against mono numerals.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workbench",
  description: "Coursework and internship command center",
  // Drives the iOS status-bar treatment when launched from the home screen.
  appleWebApp: { capable: true, title: "Workbench", statusBarStyle: "default" },
};

// Tints the browser chrome on mobile; matches --bg per theme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1e1d" },
  ],
};

// Applied before paint so an explicit light/dark choice never flashes the wrong theme.
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="glow-header min-w-0 flex-1 px-5 py-6 lg:px-8">
            {/* Capped so grids stay dense on wide monitors instead of stretching. */}
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
