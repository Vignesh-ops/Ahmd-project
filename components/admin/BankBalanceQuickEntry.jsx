"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownCircle, ArrowRight, ArrowUpCircle, Landmark, Plus, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const SUCCESS_DISPLAY_MS = 1400;

const CONFETTI_COLORS = ["#1ECFB0", "#D4A843", "#F2C96B"];

const CONFETTI_PARTICLES = Array.from({ length: 10 }, (_, index) => {
  const angle = (index / 10) * Math.PI * 2;
  const distance = 42 + (index % 3) * 6;

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotation: 120 + index * 35,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    size: index % 2 === 0 ? 7 : 5,
    round: index % 3 !== 0,
    delay: (index % 4) * 15
  };
});

export default function BankBalanceQuickEntry({ initialData }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("topup");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const enteredAmount = Number(amount) || 0;
  const newBalancePreview =
    mode === "topup"
      ? data.availableBalance + enteredAmount
      : mode === "deduct"
        ? data.availableBalance - enteredAmount
        : enteredAmount;

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShowSuccess(false), SUCCESS_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  async function save(event) {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) {
      const messages = {
        topup: "Enter an amount to add.",
        deduct: "Enter the order amount to deduct.",
        set: "Enter today's bank balance."
      };
      setError(messages[mode] || messages.set);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bank-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, mode })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save balance.");
      setData(payload);
      setAmount("");
      setOpen(false);
      setShowSuccess(true);
      router.refresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-24 right-4 z-[45] flex items-center gap-3 sm:right-6 md:bottom-7 md:right-7">
        <div className="hidden rounded-2xl border border-gold/15 bg-dark-surface/95 px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:block">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Available Balance</p>
          <p className="mt-1 font-mono text-sm font-semibold text-white">{formatCurrency(data.availableBalance, "IDR")}</p>
        </div>
        <button type="button" onClick={() => { setError(""); setMode("topup"); setAmount(""); setOpen(true); }} className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gold-light/80 bg-gradient-to-br from-gold-light via-gold to-[#a87620] text-dark-base shadow-[0_10px_30px_rgba(212,168,67,0.42),0_0_0_5px_rgba(212,168,67,0.12)] transition duration-200 hover:scale-105 hover:brightness-110 active:scale-95" aria-label="Enter today's bank balance" title="Enter today's bank balance">
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-gold-light/50" />
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quick-balance-title">
          <form onSubmit={save} noValidate className="dialog-surface w-full max-w-md rounded-[28px] border border-gold/20 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gold-light/70">Daily Entry</p>
                <h2 id="quick-balance-title" className="mt-2 text-2xl font-semibold text-white">Enter Bank Balance</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-white/55 hover:bg-white/10 hover:text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode("topup")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${mode === "topup" ? "bg-gradient-to-br from-gold-light via-gold to-[#a87620] text-dark-base shadow-[0_6px_18px_rgba(212,168,67,0.3)]" : "text-white/55 hover:text-white"}`}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Top Up
              </button>
              <button
                type="button"
                onClick={() => setMode("deduct")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${mode === "deduct" ? "bg-gradient-to-br from-gold-light via-gold to-[#a87620] text-dark-base shadow-[0_6px_18px_rgba(212,168,67,0.3)]" : "text-white/55 hover:text-white"}`}
              >
                <ArrowDownCircle className="h-4 w-4" />
                Deduct
              </button>
              <button
                type="button"
                onClick={() => setMode("set")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${mode === "set" ? "bg-gradient-to-br from-gold-light via-gold to-[#a87620] text-dark-base shadow-[0_6px_18px_rgba(212,168,67,0.3)]" : "text-white/55 hover:text-white"}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Set Exact
              </button>
            </div>

            <div className="mt-5">
              <label htmlFor="quick-balance-amount" className="mb-2 block text-sm font-medium text-white/75">
                {mode === "topup" ? "Amount to Add" : mode === "deduct" ? "Order Amount (Placed Outside the App)" : "Today’s Bank Balance"}
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-dark-input pl-4 pr-3 focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20">
                <span className="shrink-0 text-sm font-semibold text-white/35">Rp</span>
                <input
                  id="quick-balance-amount"
                  min="0"
                  step="0.01"
                  type="number"
                  value={amount}
                  onChange={(event) => { setAmount(event.target.value); if (error) setError(""); }}
                  placeholder="30,000"
                  autoFocus
                  className="w-full appearance-none bg-transparent py-3 font-mono text-base text-white outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Current</p>
                  <p className="mt-1 font-mono text-sm text-white/75">{formatCurrency(data.availableBalance, "IDR")}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/30" />
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">New Balance</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-gold-light">{amount ? formatCurrency(newBalancePreview, "IDR") : "—"}</p>
                </div>
              </div>

              {mode === "set" && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200/90">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  This replaces the current balance entirely instead of adding to it.
                </p>
              )}

              {mode === "deduct" && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200/90">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Use this only for Indonesia orders placed directly with the client, outside this app.
                </p>
              )}

              {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} icon={saving ? RefreshCw : Landmark}>{saving ? "Saving..." : "Save Balance"}</Button>
            </div>
          </form>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="dialog-surface w-full max-w-sm rounded-xl border border-gold/20 p-6 shadow-2xl">
            <div className="status-result-pop flex flex-col items-center gap-3 py-3 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center" aria-hidden="true">
                {CONFETTI_PARTICLES.map((particle, index) => (
                  <span
                    key={index}
                    className="status-confetti-particle"
                    style={{
                      width: particle.size,
                      height: particle.size,
                      background: particle.color,
                      borderRadius: particle.round ? "50%" : "2px",
                      "--confetti-x": `${particle.x}px`,
                      "--confetti-y": `${particle.y}px`,
                      "--confetti-rot": `${particle.rotation}deg`,
                      "--confetti-delay": `${particle.delay}ms`
                    }}
                  />
                ))}
                <svg viewBox="0 0 52 52" className="h-16 w-16">
                  <circle
                    className="status-success-circle"
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="#1ECFB0"
                    strokeWidth="3"
                  />
                  <path
                    className="status-success-check"
                    fill="none"
                    stroke="#1ECFB0"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 27l7 7 15-15"
                  />
                </svg>
              </span>
              <p className="text-lg font-semibold text-white">Balance Saved</p>
              <p className="text-sm text-white/55">{formatCurrency(data.availableBalance, "IDR")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
