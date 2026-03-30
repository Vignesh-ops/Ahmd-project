"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SettingsForm({ settings, storeName }) {
  const router = useRouter();
  const [form, setForm] = useState({
    rate1: settings.rate1,
    rate2: settings.rate2,
    service1: settings.service1,
    service2: settings.service2
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(event) {
    event.preventDefault();
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

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Could not save settings.");
        return;
      }

      setForm({
        rate1: payload.rate1,
        rate2: payload.rate2,
        service1: payload.service1,
        service2: payload.service2
      });
      router.refresh();
      setMessage("Settings saved. New orders will use the updated rate and service charge.");
    } catch (error) {
      setMessage(error.message || "Could not save settings.");
    } finally {
      setLoading(false);
    }
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
          step="0.01"
          value={form.rate1}
          onChange={(event) => setForm((current) => ({ ...current, rate1: event.target.value }))}
        />
        <Input
          label="INDIA Exchange Rate"
          type="number"
          step="0.01"
          value={form.rate2}
          onChange={(event) => setForm((current) => ({ ...current, rate2: event.target.value }))}
        />
        <Input
          label="INDONASIA Service Charge"
          type="number"
          step="0.01"
          value={form.service1}
          onChange={(event) => setForm((current) => ({ ...current, service1: event.target.value }))}
        />
        <Input
          label="INDIA Service Charge"
          type="number"
          step="0.01"
          value={form.service2}
          onChange={(event) => setForm((current) => ({ ...current, service2: event.target.value }))}
        />
        <Input label="Store Name" value={storeName} disabled className="md:col-span-2" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/55">{message || "Rates are used to prefill the order forms."}</p>
        <Button type="submit" loading={loading}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
