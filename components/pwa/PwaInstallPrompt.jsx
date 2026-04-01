"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const DISMISS_KEY = "ahmad-install-dismissed";

export default function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return undefined;
    }

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setPromptEvent(event);
      setInstalled(false);
      setDismissed(false);
    }

    function handleInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  function closePrompt() {
    window.localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  if (!promptEvent || dismissed || installed) {
    return null;
  }

  return (
    <div className="install-prompt fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-[28px] border border-gold/20 bg-dark-surface/95 p-4 shadow-2xl backdrop-blur-xl md:bottom-6">
      <p className="text-xs uppercase tracking-[0.22em] text-gold-light/80">Install App</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Add Ahmad to your home screen</h2>
      <p className="mt-2 text-sm text-white/60">
        Install the app on Android for faster access, a full-screen experience, and offline fallback.
      </p>
      <div className="mt-4 flex gap-3">
        <Button className="flex-1" onClick={installApp}>
          Install
        </Button>
        <Button className="flex-1" variant="secondary" onClick={closePrompt}>
          Later
        </Button>
      </div>
    </div>
  );
}
