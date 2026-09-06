import { DM_Mono, DM_Sans, Syne } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/print.css";
import Providers from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap"
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap"
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
  display: "swap"
});

export const metadata = {
  title: "AHMAD Enterprises",
  description: "Money remittance order management for AHMAD Enterprises",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/Ahmad_logo.png",
    shortcut: "/Ahmad_logo.png",
    apple: "/Ahmad_logo.png"
  }
};

export const viewport = {
  themeColor: "#0a0c10",
  viewportFit: "cover"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmMono.variable} ${syne.variable}`}>
      <body className="bg-dark-base font-body text-white antialiased" suppressHydrationWarning>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
