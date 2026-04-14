"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bluetooth, Check, Plus, RefreshCw, Usb, Wifi } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  canUseNativePrinters,
  getAvailablePrinters,
  pairBluetoothPrinter,
  printTestSlip,
  requestBluetoothConnectPermissions,
  requestBluetoothScanPermissions,
  openBluetoothPermissionSettings,
  setPreferredPrinter,
  startBluetoothDiscovery
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
  const [printerTab, setPrinterTab] = useState("choose");
  const [nativeReady, setNativeReady] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState({ bluetooth: [], usb: [], preferred: null });
  const [scanResults, setScanResults] = useState([]);
  const [scanActive, setScanActive] = useState(false);
  const [needsPermissionHelp, setNeedsPermissionHelp] = useState(false);
  const discoveryRef = useRef(null);

  const preferredLabel = availablePrinters.preferred?.name || "No preferred printer yet";

  function getPrinterKey(printer) {
    return `${printer.type}-${printer.id}`;
  }

  async function refreshPrinters(silent = false) {
    if (!canUseNativePrinters()) {
      setAvailablePrinters({ bluetooth: [], usb: [], preferred: null });
      if (!silent) setPrinterMessage("Printer setup is only available inside the Android app.");
      return;
    }

    try {
      const connectPermission = await requestBluetoothConnectPermissions();

      if (!connectPermission?.granted) {
        setNeedsPermissionHelp(true);
        if (!silent) {
          setPrinterMessage("Bluetooth permission is required to list paired printers.");
        }
        setAvailablePrinters((current) => ({ ...current, bluetooth: [] }));
        return;
      }

      const data = await getAvailablePrinters();
      setAvailablePrinters(data);
      setNeedsPermissionHelp(false);

      if (!silent && !data.preferred) {
        setPrinterMessage("Choose a printer to make it the default for all prints.");
      }
    } catch (error) {
      setPrinterMessage(`Could not load printers: ${error.message}`);
    }
  }

  async function handleSelectPreferred(printer) {
    try {
      setPrinterLoading(getPrinterKey(printer));
      setPrinterMessage("");
      await setPreferredPrinter(printer);
      await refreshPrinters(true);
      setPrinterMessage(`${printer.name} is now preferred.`);
    } catch (error) {
      setPrinterMessage(`Could not set preferred printer: ${error.message}`);
    } finally {
      setPrinterLoading("");
    }
  }

  async function handleTestPrint(printer) {
    try {
      setPrinterLoading(`test-${getPrinterKey(printer)}`);
      setPrinterMessage("");
      const result = await printTestSlip(printer);
      if (result.fallback) {
        setPrinterMessage(`Test print failed: ${result.error || "Unknown error"}`);
      } else {
        setPrinterMessage(`Printed test slip to ${result.deviceName}.`);
      }
    } catch (error) {
      setPrinterMessage(`Could not print test slip: ${error.message}`);
    } finally {
      setPrinterLoading("");
    }
  }

  // Permission request + scan are combined here so the permission dialog
  // is always triggered by a direct user tap on "Scan for Printers" —
  // never on tab switch (which is not a direct user gesture on Android 15).
  async function handleStartScan() {
    if (!canUseNativePrinters()) {
      setPrinterMessage("Bluetooth scan is only available inside the Android app.");
      return;
    }

    setPrinterMessage("");
    setScanResults([]);
    setScanActive(true);

    try {
      const permission = await requestBluetoothScanPermissions();
      if (!permission.granted) {
        setScanActive(false);
        setNeedsPermissionHelp(true);
        setPrinterMessage("Bluetooth permission is required to scan for printers. Tap the button below to open settings.");
        return;
      }
      setNeedsPermissionHelp(false);

      if (discoveryRef.current) {
        await discoveryRef.current.remove();
        discoveryRef.current = null;
      }

      discoveryRef.current = await startBluetoothDiscovery({
        onDeviceFound: (device) => {
          if (!device?.address) return;
          setScanResults((current) => {
            if (current.some((item) => item.address === device.address)) {
              return current;
            }
            return [...current, device];
          });
        },
        onFinished: () => {
          setScanActive(false);
        }
      });
    } catch (error) {
      setScanActive(false);
      setPrinterMessage(`Bluetooth scan failed: ${error.message}`);
    }
  }


  async function handleAddPrinter(device) {
    if (!device?.address) return;

    try {
      setPrinterLoading(`add-${device.address}`);
      setPrinterMessage("");

      const permission = await requestBluetoothConnectPermissions();
      if (!permission?.granted) {
        setNeedsPermissionHelp(true);
        setPrinterMessage("Bluetooth permission is required before pairing.");
        return;
      }

      await pairBluetoothPrinter(device.address);
      await refreshPrinters(true);
      setPrinterMessage(`${device.name || "Printer"} paired. Choose it in the list to set preferred.`);
    } catch (error) {
      setPrinterMessage(`Could not pair printer: ${error.message}`);
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
        headers: { "Content-Type": "application/json" },
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
    setNativeReady(canUseNativePrinters());

    return () => {
      if (discoveryRef.current) {
        discoveryRef.current.remove();
        discoveryRef.current = null;
      }
    };
  }, []);

  async function startScanAfterPermission() {
    setPrinterMessage("");
    setScanResults([]);
    setScanActive(true);

    try {
      if (discoveryRef.current) {
        await discoveryRef.current.remove();
        discoveryRef.current = null;
      }

      discoveryRef.current = await startBluetoothDiscovery({
        onDeviceFound: (device) => {
          if (!device?.address) return;

          setScanResults((current) => {
            if (current.some((item) => item.address === device.address)) return current;
            return [...current, device];
          });
        },
        onFinished: () => {
          setScanActive(false);
        },
      });
    } catch (error) {
      setScanActive(false);
      setPrinterMessage(`Bluetooth scan failed: ${error.message}`);
    }
  }

  async function handleAddPrinterClick() {
    if (!canUseNativePrinters()) {
      setPrinterMessage("Bluetooth scan is only available inside the Android app.");
      return;
    }

    setPrinterTab("add");
    setPrinterMessage("");
    setScanResults([]);
    setScanActive(false);
    setNeedsPermissionHelp(false);

    const permission = await requestBluetoothScanPermissions();

    // 🔥 KEY CHANGE
    if (!permission?.granted) {
      setNeedsPermissionHelp(true);
      setPrinterMessage("Please allow Nearby devices permission.");
      return;
    }

    // 🔥 ADD DELAY (CRITICAL FOR ANDROID 14/15)
    setTimeout(() => {
      startScanAfterPermission();
    }, 300);
  }

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
          step="0.00001"
          value={form.rate1}
          readOnly={!isAdmin}
          onChange={
            isAdmin ? (event) => setForm((current) => ({ ...current, rate1: event.target.value })) : undefined
          }
        />
        <Input
          label="INDIA Exchange Rate"
          type="number"
          step="0.00001"
          value={form.rate2}
          readOnly={!isAdmin}
          onChange={
            isAdmin ? (event) => setForm((current) => ({ ...current, rate2: event.target.value })) : undefined
          }
        />
        <Input
          label="INDONASIA Service Charge"
          type="number"
          step="0.00001"
          value={form.service1}
          readOnly={!isAdmin}
          onChange={
            isAdmin ? (event) => setForm((current) => ({ ...current, service1: event.target.value })) : undefined
          }
        />
        <Input
          label="INDIA Service Charge"
          type="number"
          step="0.00001"
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Printer Setup</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Preferred Printer</h3>
            <p className="text-sm text-white/50">{preferredLabel}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* "Choose Printer" — triggers permission + load on click */}
            <Button
              type="button"
              variant={printerTab === "choose" ? "secondary" : "ghost"}
              onClick={() => {
                setPrinterTab("choose");
                void refreshPrinters();
              }}
            >
              Choose Printer
            </Button>

            {/* "Add New Printer" — only switches the tab, NO permission call here.
                The permission is requested when the user taps "Scan for Printers",
                which is an explicit user gesture that Android 15 requires. */}
            {/* <Button
              type="button"
              variant={printerTab === "add" ? "secondary" : "ghost"}
              onClick={() => {
                setPrinterTab("add");
                setPrinterMessage("");
                setNeedsPermissionHelp(false);
                setScanResults([]);
              }}
            >
              Add New Printer old
            </Button> */}

            <Button
              type="button"
              variant={printerTab === "add" ? "secondary" : "ghost"}
              onClick={handleAddPrinterClick}
            >
              Add New Printer
            </Button>
          </div>
        </div>

        {printerTab === "choose" ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/60">
                Choose a Bluetooth or USB printer to make it the default for all prints.
              </p>
              <Button
                type="button"
                variant="ghost"
                icon={RefreshCw}
                loading={printerLoading === "refresh"}
                onClick={async () => {
                  setPrinterLoading("refresh");
                  await refreshPrinters();
                  setPrinterLoading("");
                }}
              >
                Refresh
              </Button>
            </div>

            {!nativeReady ? (
              <p className="text-sm text-white/55">Printer setup is only available inside the Android app.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Bluetooth className="h-4 w-4 text-gold-light" />
                    Bluetooth Printers
                  </div>
                  {availablePrinters.bluetooth.length > 0 ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {availablePrinters.bluetooth.map((printer) => (
                        <div
                          key={getPrinterKey(printer)}
                          className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{printer.name}</p>
                            <p className="text-xs text-white/45">
                              {printer.preferred ? "Preferred printer" : "Tap Set Preferred to use this printer"}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            {!printer.preferred ? (
                              <Button
                                type="button"
                                variant="secondary"
                                icon={Check}
                                loading={printerLoading === getPrinterKey(printer)}
                                onClick={() => handleSelectPreferred(printer)}
                              >
                                Set Preferred
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              icon={Bluetooth}
                              loading={printerLoading === `test-${getPrinterKey(printer)}`}
                              onClick={() => handleTestPrint(printer)}
                            >
                              Test Print
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-white/55">No paired Bluetooth printers yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Usb className="h-4 w-4 text-gold-light" />
                    USB Printers
                  </div>
                  {availablePrinters.usb.length > 0 ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {availablePrinters.usb.map((printer) => (
                        <div
                          key={getPrinterKey(printer)}
                          className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{printer.name}</p>
                            <p className="text-xs text-white/45">
                              {printer.preferred ? "Preferred printer" : "Tap Set Preferred to use this printer"}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            {!printer.preferred ? (
                              <Button
                                type="button"
                                variant="secondary"
                                icon={Check}
                                loading={printerLoading === getPrinterKey(printer)}
                                onClick={() => handleSelectPreferred(printer)}
                              >
                                Set Preferred
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              icon={Usb}
                              loading={printerLoading === `test-${getPrinterKey(printer)}`}
                              onClick={() => handleTestPrint(printer)}
                            >
                              Test Print
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-white/55">No USB printers detected.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/60">
                Tap Scan to find nearby Bluetooth printers. You will be asked to allow Bluetooth access.
              </p>
              <Button
                type="button"
                variant="secondary"
                icon={Wifi}
                loading={scanActive}
                onClick={handleStartScan}
              >
                {scanActive ? "Scanning..." : "Scan for Printers"}
              </Button>
            </div>

            {scanResults.length > 0 ? (
              <div className="flex flex-col gap-2">
                {scanResults.map((device) => (
                  <div
                    key={device.address}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{device.name || "Bluetooth printer"}</p>
                      <p className="text-xs text-white/45">{device.address}</p>
                    </div>
                    <Button
                      type="button"
                      icon={Plus}
                      loading={printerLoading === `add-${device.address}`}
                      onClick={() => handleAddPrinter(device)}
                    >
                      Add Printer
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/55">
                {scanActive ? "Scanning for nearby Bluetooth printers..." : "No printers found yet. Tap Scan for Printers to start."}
              </p>
            )}
          </div>
        )}

        <p className="mt-4 text-sm text-red/55">
          {printerMessage || "After selecting a preferred printer, all print actions will use it automatically."}
        </p>
        {needsPermissionHelp ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={async () => {
              try {
                await openBluetoothPermissionSettings();
              } catch (error) {
                setPrinterMessage(error.message || "Could not open permission settings.");
              }
            }}
          >
            Open Bluetooth Permission Settings
          </Button>
        ) : null}
      </div>
    </form>
  );
}