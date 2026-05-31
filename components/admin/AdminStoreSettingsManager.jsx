"use client";

import { useState } from "react";
import { Pencil, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function toForm(settings) {
  return {
    rate1: String(settings?.rate1 ?? ""),
    rate2: String(settings?.rate2 ?? ""),
    service1: String(settings?.service1 ?? ""),
    service2: String(settings?.service2 ?? "")
  };
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
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">{store.storeCode || "STORE"}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{store.storeName || store.username}</h2>
                <p className="mt-1 text-sm text-white/50">{store.username}</p>
              </div>
              <p className="text-sm text-white/50">{messages[store.id] || "Default pricing for new orders."}</p>
            </div>

            {isEditing ? (
              <div className="grid-form two-col">
                <Input
                  label="INDONASIA Exchange Rate"
                  inputMode="decimal"
                  value={form.rate1}
                  onChange={(event) => updateField(store.id, "rate1", event.target.value)}
                />
                <Input
                  label="INDIA Exchange Rate"
                  inputMode="decimal"
                  value={form.rate2}
                  onChange={(event) => updateField(store.id, "rate2", event.target.value)}
                />
                <Input
                  label="INDONASIA Service Charge"
                  inputMode="decimal"
                  value={form.service1}
                  onChange={(event) => updateField(store.id, "service1", event.target.value)}
                />
                <Input
                  label="INDIA Service Charge"
                  inputMode="decimal"
                  value={form.service2}
                  onChange={(event) => updateField(store.id, "service2", event.target.value)}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">INDONASIA Rate</p>
                  <p className="mt-2 font-mono text-lg font-semibold text-white">{form.rate1}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">INDIA Rate</p>
                  <p className="mt-2 font-mono text-lg font-semibold text-white">{form.rate2}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">INDONASIA Service</p>
                  <p className="mt-2 font-mono text-lg font-semibold text-white">{form.service1}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">INDIA Service</p>
                  <p className="mt-2 font-mono text-lg font-semibold text-white">{form.service2}</p>
                </div>
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
