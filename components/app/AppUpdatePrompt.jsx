"use client";

import { useEffect, useMemo, useState } from "react";
import { registerPlugin } from "@capacitor/core";
import Button from "@/components/ui/Button";
import { APP_VERSION } from "@/lib/app-version";
import { isNativeCapacitor } from "@/lib/native";

const DISMISS_KEY_PREFIX = "ahmad-apk-update-dismissed";
const AppInfo = registerPlugin("AppInfo");

async function getInstalledVersion() {
  try {
    const info = await AppInfo.getInfo();
    if (info?.versionName) {
      return String(info.versionName);
    }
  } catch {
    // Fallback handled below.
  }

  return APP_VERSION;
}

export default function AppUpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const dismissKey = useMemo(
    () => `${DISMISS_KEY_PREFIX}-${updateInfo?.latestVersion || "none"}`,
    [updateInfo?.latestVersion]
  );

  useEffect(() => {
    let active = true;

    async function checkForUpdates() {
      if (!isNativeCapacitor()) {
        return;
      }

      try {
        const installedVersion = await getInstalledVersion();
        const response = await fetch(`/api/app-update?current=${encodeURIComponent(installedVersion)}`, {
          cache: "no-store"
        });
        const payload = await response.json();

        if (!active || !payload?.available) {
          return;
        }

        if (window.localStorage.getItem(`${DISMISS_KEY_PREFIX}-${payload.latestVersion}`) === "1") {
          return;
        }

        setUpdateInfo(payload);
        setVisible(true);
      } catch {
        // Silent: app update check should not block app usage.
      }
    }

    void checkForUpdates();

    return () => {
      active = false;
    };
  }, []);

  function dismissPrompt() {
    if (updateInfo?.latestVersion) {
      window.localStorage.setItem(dismissKey, "1");
    }
    setVisible(false);
  }

  async function startDownload() {
    if (!updateInfo?.downloadUrl) {
      return;
    }

    try {
      setLoading(true);
      const [{ Browser }] = await Promise.all([import("@capacitor/browser")]);
      const downloadLink = new URL(updateInfo.downloadUrl, window.location.origin).toString();
      await Browser.open({ url: downloadLink });
      dismissPrompt();
    } finally {
      setLoading(false);
    }
  }

  if (!visible || !updateInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="dialog-surface w-full max-w-md rounded-xl border border-gold/20 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-light/80">App Update</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Update Available</h3>
        <p className="mt-3 text-sm text-white/80">
          New version v{updateInfo.latestVersion} is available. Current version is v{updateInfo.currentVersion}.
        </p>
        <p className="mt-2 text-xs text-white/60">
          Tap Download, then open the APK to install.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={dismissPrompt}>
            Later
          </Button>
          <Button type="button" loading={loading} onClick={() => void startDownload()}>
            Download Update
          </Button>
        </div>
      </div>
    </div>
  );
}
