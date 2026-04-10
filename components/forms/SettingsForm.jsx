"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bluetooth, Check, Plus, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  bluetoothPrint,
  canListGrantedBluetoothDevices,
  canUseBluetoothPrinting,
  getSavedBluetoothDevices,
  setPreferredPrinter,
  requestBluetoothDevice
} from "@/lib/print";

export default function SettingsForm({ settings, storeName, isAdmin }) {
  const router = useRouter();
  const [form, setForm] = useState({
    rate1: settings.rate1,
    rate2: settings.rate2,
    service1: settings.service1,
    service2: settings.service2
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [printerLoading, setPrinterLoading] = useState("");
  const [printerMessage, setPrinterMessage] = useState("");
  const [savedPrinters, setSavedPrinters] = useState([]);
  const [bluetoothReady, setBluetoothReady] = useState(false);
  const [canListSavedPrinters, setCanListSavedPrinters] = useState(false);

  async function refreshSavedPrinters(silent = false) {
    if (!canUseBluetoothPrinting() || !canListGrantedBluetoothDevices()) {
      setSavedPrinters([]);
      return;
    }

    try {
      const devices = await getSavedBluetoothDevices();
      setSavedPrinters(devices);
      if (!silent && devices.length === 0) {
        setPrinterMessage("No saved printers yet. Pair one to make it preferred.");
      }
    } catch (error) {
      if (!silent) {
        setPrinterMessage(`Could not load saved printers: ${error.message}`);
      }
    }
  }

  async function handlePairPrinter() {
    try {
      setPrinterLoading("pair");
      setPrinterMessage("");
      const device = await requestBluetoothDevice();
      await setPreferredPrinter(device.deviceId || device.id);
      await refreshSavedPrinters(true);
      setPrinterMessage(`${device.name || "Printer"} paired and set as preferred.`);
    } catch (error) {
      setPrinterMessage(`Could not pair printer: ${error.message}`);
    } finally {
      setPrinterLoading("");
    }
  }

  async function handleSelectPreferred(device) {
    try {
      setPrinterLoading(device.deviceId || device.id);
      setPrinterMessage("");
      await setPreferredPrinter(device.deviceId || device.id);
      await refreshSavedPrinters(true);
      setPrinterMessage(`${device.name || "Printer"} is now preferred.`);
    } catch (error) {
      setPrinterMessage(`Could not set preferred printer: ${error.message}`);
    } finally {
      setPrinterLoading("");
    }
  }

  async function handleTestPrint(device) {
    try {
      setPrinterLoading(`test-${device.deviceId || device.id}`);
      setPrinterMessage("");
      const result = await bluetoothPrint("TEST PRINT\nAHMAD ENTERPRISES\nBluetooth printer connected.\n\n\n", device);
      if (result.fallback) {
        setPrinterMessage(`Bluetooth test print failed: ${result.error || "Unknown error"}`);
      } else {
        setPrinterMessage(`Printed test slip to ${result.deviceName}.`);
      }
      await refreshSavedPrinters(true);
    } catch (error) {
      setPrinterMessage(`Could not print test slip: ${error.message}`);
    } finally {
      setPrinterLoading("");
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!isAdmin) {
      setMessage("Only admin users can update settings.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setMessage(payload?.error || "Could not save settings.");
        return;
      }

      setForm({
        rate1: payload?.rate1,
        rate2: payload?.rate2,
        service1: payload?.service1,
        service2: payload?.service2
      });
      router.refresh();
      setMessage("Settings saved. New orders will use the updated rate and service charge.");
    } catch (error) {
      setMessage(error.message || "Could not save settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setBluetoothReady(canUseBluetoothPrinting());
    setCanListSavedPrinters(canListGrantedBluetoothDevices());
    void refreshSavedPrinters(true);
  }, []);

  return (
    <form onSubmit={handleSave} className="glass-panel rounded-[32px] border border-white/5 p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-white/35">Store Settings</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{storeName}</h2>
      </div>

      <div className="grid-form two-col">
        <Input
          label="INDONASIA Exchange Rate"
          type="number"
          step="0.01"
          value={form.rate1}
          readOnly={!isAdmin}
          onChange={
            isAdmin ? (event) => setForm((current) => ({ ...current, rate1: event.target.value })) : undefined
          }
        />
        <Input
          label="INDIA Exchange Rate"
          type="number"
          step="0.01"
          value={form.rate2}
          readOnly={!isAdmin}
          onChange={
            isAdmin ? (event) => setForm((current) => ({ ...current, rate2: event.target.value })) : undefined
          }
        />
        <Input
          label="INDONASIA Service Charge"
          type="number"
          step="0.01"
          value={form.service1}
          readOnly={!isAdmin}
          onChange={
            isAdmin ? (event) => setForm((current) => ({ ...current, service1: event.target.value })) : undefined
          }
        />
        <Input
          label="INDIA Service Charge"
          type="number"
          step="0.01"
          value={form.service2}
          readOnly={!isAdmin}
          onChange={
            isAdmin ? (event) => setForm((current) => ({ ...current, service2: event.target.value })) : undefined
          }
        />
        <Input label="Store Name" value={storeName} disabled className="md:col-span-2" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-red/55">
          {message ||
            (isAdmin
              ? "Rates are used to prefill the order forms."
              : "You can view these settings, but only admin users can edit and save changes.")}
        </p>
        {isAdmin ? (
          <Button type="submit" loading={loading}>
            Save Settings
          </Button>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Bluetooth Printer</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Preferred Printer</h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canListSavedPrinters ? (
              <Button
                type="button"
                variant="ghost"
                icon={RefreshCw}
                loading={printerLoading === "refresh"}
                onClick={async () => {
                  setPrinterLoading("refresh");
                  await refreshSavedPrinters();
                  setPrinterLoading("");
                }}
              >
                Refresh
              </Button>
            ) : null}
            {bluetoothReady ? (
              <Button
                type="button"
                variant="secondary"
                icon={Plus}
                loading={printerLoading === "pair"}
                onClick={handlePairPrinter}
              >
                Pair Printer
              </Button>
            ) : null}
          </div>
        </div>

        {bluetoothReady && canListSavedPrinters ? (
          savedPrinters.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2">
              {savedPrinters.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{device.name || "Unnamed printer"}</p>
                    <p className="text-xs text-white/45">
                      {device.preferred ? "Preferred printer for all print actions" : "Tap Set Preferred to use this printer"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {!device.preferred ? (
                      <Button
                        type="button"
                        variant="secondary"
                        icon={Check}
                        loading={printerLoading === (device.deviceId || device.id)}
                        onClick={() => handleSelectPreferred(device)}
                      >
                        Set Preferred
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      icon={Bluetooth}
                      loading={printerLoading === `test-${device.deviceId || device.id}`}
                      onClick={() => handleTestPrint(device)}
                    >
                      Test Print
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/55">
              No saved printer. Tap Pair Printer and allow Bluetooth permissions.
            </p>
          )
        ) : (
          <p className="mt-4 text-sm text-white/55">
            Bluetooth printer setup is only available on supported Android devices.
          </p>
        )}

        <p className="mt-4 text-sm text-red/55">
          {printerMessage || "After selecting preferred printer, all print actions will use it automatically."}
        </p>
      </div>
    </form>
  );
}
