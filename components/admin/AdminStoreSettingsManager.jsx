"use client";

import { useState } from "react";
import { ArrowRightLeft, BadgeDollarSign, IndianRupee, Pencil, Save, Settings2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function toForm(settings) {
  return {
    rate1: String(settings?.rate1 ?? ""),
    rate2: String(settings?.rate2 ?? ""),
    service1: String(settings?.service1 ?? ""),
    service2: String(settings?.service2 ?? "")
  };
}

const pricingItems = [
  {
    field: "rate1",
    label: "Indonesia Rate",
    description: "Default exchange rate",
    accent: "teal",
    icon: ArrowRightLeft,
    flag: "indonesia"
  },
  {
    field: "rate2",
    label: "India Rate",
    description: "Default exchange rate",
    accent: "blue",
    icon: ArrowRightLeft,
    flag: "india"
  },
  {
    field: "service1",
    label: "Indonesia Service",
    description: "Default service charge",
    accent: "teal",
    icon: Settings2,
    flag: "indonesia"
  },
  {
    field: "service2",
    label: "India Service",
    description: "Default service charge",
    accent: "blue",
    icon: IndianRupee,
    flag: "india"
  }
];

function PricingValueCard({ item, value }) {
  const Icon = item.icon;

  return (
    <div className={cn("admin-rate-card", `admin-rate-card--${item.accent}`)}>
      <div className={cn("admin-rate-icon", `admin-rate-icon--${item.accent}`)}>
        <span className={cn("admin-rate-flag", `admin-rate-flag--${item.flag}`)} aria-hidden="true" />
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("admin-rate-label", `admin-rate-label--${item.accent}`)}>
          {item.label}
        </p>
        <p className="mt-1 text-sm text-white/55">{item.description}</p>
      </div>
      <p className="shrink-0 text-right font-mono text-xl font-semibold text-white">{value || "0"}</p>
    </div>
  );
}

export default function AdminStoreSettingsManager({ stores = [] }) {
  const initialForms = () => Object.fromEntries(stores.map((store) => [store.id, toForm(store.settings)]));
  const [savedForms, setSavedForms] = useState(initialForms);
  const [forms, setForms] = useState(initialForms);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [messages, setMessages] = useState({});

  function updateField(userId, field, value) {
    const normalized = String(value).replace(/,/g, "");

    if (!/^\d*\.?\d*$/.test(normalized)) {
      return;
    }

    setForms((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        [field]: normalized
      }
    }));
    setMessages((current) => ({
      ...current,
      [userId]: ""
    }));
  }

  async function saveSettings(userId) {
    const form = forms[userId];

    setSavingId(userId);
    setMessages((current) => ({
      ...current,
      [userId]: ""
    }));

    try {
      const response = await fetch(`/api/admin/settings/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify(form)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not update store settings.");
      }

      setForms((current) => ({
        ...current,
        [userId]: toForm(payload.settings)
      }));
      setSavedForms((current) => ({
        ...current,
        [userId]: toForm(payload.settings)
      }));
      setMessages((current) => ({
        ...current,
        [userId]: "Updated. New orders for this store will use these values."
      }));
      setEditingId(null);
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [userId]: error.message || "Could not update store settings."
      }));
    } finally {
      setSavingId(null);
    }
  }

  function cancelEdit(store) {
    setForms((current) => ({
      ...current,
      [store.id]: savedForms[store.id] || toForm(store.settings)
    }));
    setMessages((current) => ({
      ...current,
      [store.id]: ""
    }));
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {stores.map((store) => {
        const form = forms[store.id] || toForm(store.settings);
        const isEditing = editingId === store.id;

        return (
          <div key={store.id} className="glass-panel rounded-[28px] border border-white/5 p-5">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">{store.storeCode || "STORE"}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{store.storeName || store.username}</h2>
                <p className="mt-1 text-sm text-white/60">{store.username}</p>
              </div>
              <p className="text-sm text-white/60">{messages[store.id] || "Default pricing for new orders."}</p>
            </div>

            {isEditing ? (
              <div className="grid-form two-col">
                <Input
                  label="Indonesia Exchange Rate"
                  icon={BadgeDollarSign}
                  inputMode="decimal"
                  value={form.rate1}
                  onChange={(event) => updateField(store.id, "rate1", event.target.value)}
                />
                <Input
                  label="India Exchange Rate"
                  icon={BadgeDollarSign}
                  inputMode="decimal"
                  value={form.rate2}
                  onChange={(event) => updateField(store.id, "rate2", event.target.value)}
                />
                <Input
                  label="Indonesia Service Charge"
                  icon={Settings2}
                  inputMode="decimal"
                  value={form.service1}
                  onChange={(event) => updateField(store.id, "service1", event.target.value)}
                />
                <Input
                  label="India Service Charge"
                  icon={Settings2}
                  inputMode="decimal"
                  value={form.service2}
                  onChange={(event) => updateField(store.id, "service2", event.target.value)}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pricingItems.map((item) => (
                  <PricingValueCard key={item.field} item={item} value={form[item.field]} />
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    icon={Save}
                    loading={savingId === store.id}
                    onClick={() => saveSettings(store.id)}
                  >
                    Save Store Settings
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => cancelEdit(store)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="button" variant="secondary" icon={Pencil} onClick={() => setEditingId(store.id)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {!stores.length ? (
        <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center text-white/55">
          No store users found.
        </div>
      ) : null}
    </div>
  );
}
