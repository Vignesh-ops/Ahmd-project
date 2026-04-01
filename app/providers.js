"use client";

import { SessionProvider } from "next-auth/react";
import { RouteFeedbackProvider } from "@/components/navigation/RouteFeedbackProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <RouteFeedbackProvider>
          <PwaRegistrar />
          {children}
          <PwaInstallPrompt />
        </RouteFeedbackProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
