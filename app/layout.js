import "@/styles/globals.css";
import "@/styles/print.css";
import Providers from "./providers";

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-dark-base font-body text-white antialiased" suppressHydrationWarning>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
