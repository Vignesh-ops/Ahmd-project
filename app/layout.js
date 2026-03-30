import "@/styles/globals.css";
import "@/styles/print.css";
import Providers from "./providers";

export const metadata = {
  title: "AHMAD Enterprises",
  description: "Money remittance order management for AHMAD Enterprises",
  icons: {
    icon: "/Ahmad_logo.png",
    shortcut: "/Ahmad_logo.png",
    apple: "/Ahmad_logo.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-dark-base font-body text-white antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=window.localStorage.getItem("ahmad-theme");var theme=(stored==="light"||stored==="dark")?stored:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=theme;document.body&&document.body.setAttribute("data-theme",theme);}catch(error){document.documentElement.dataset.theme="dark";}})();`
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
