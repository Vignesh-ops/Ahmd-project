"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpCircle, ArrowUpRight, CalendarClock, ChevronLeft, ChevronRight, Landmark, RefreshCw, SlidersHorizontal, Wallet, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const emptyForm = { amount: "", reason: "" };

function money(value) {
  return formatCurrency(value, "IDR");
}

function SummaryCard({ label, value, detail, tone = "default", icon: Icon }) {
  return (
    <div className={`glass-panel rounded-[28px] border border-white/5 p-5 ${tone === "teal" ? "shadow-[0_18px_55px_rgba(45,212,191,0.08)]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
        <Icon className={tone === "teal" ? "h-5 w-5 text-teal" : "h-5 w-5 text-gold-light/75"} />
      </div>
      <p className="mt-4 font-mono text-xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-white/45">{detail}</p>
    </div>
  );
}

export default function BankBalanceManager({ initialData }) {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState("topup");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 10;

  const enteredAmount = Number(form.amount) || 0;
  const newBalancePreview = mode === "topup" ? data.availableBalance + enteredAmount : enteredAmount;

  async function saveAdjustment(event) {
    event.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setMessage(mode === "topup" ? "Enter an amount to add." : "Enter today's bank balance.");
      return;
    }
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/bank-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save adjustment.");
      setData(payload);
      setHistoryPage(1);
      setForm(emptyForm);
      setOpen(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  const updated = data.updatedAt ? formatDateTime(data.updatedAt) : "Not updated yet";
  const totalHistoryPages = Math.max(1, Math.ceil(data.history.length / historyPageSize));
  const visibleHistory = data.history.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  return (
    <>
      <section className="glass-panel overflow-hidden rounded-[36px] border border-gold/15 bg-gradient-to-br from-gold/10 via-transparent to-teal/5 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-gold/15 bg-gold/10 px-3.5 py-2.5 text-gold-light shadow-[0_8px_24px_rgba(212,168,67,0.08)]"><Wallet className="h-5 w-5" /><span className="text-sm font-bold tracking-wide">Available Balance · Today</span></div>
            <p className={`mt-4 break-words font-mono text-4xl font-bold tracking-tight sm:text-5xl ${data.availableBalance < 0 ? "text-red-300" : "text-white"}`}>{money(data.availableBalance)}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/55"><CalendarClock className="h-4 w-4" />Last updated {updated}</p>
          </div>
          <Button icon={Landmark} onClick={() => { setMessage(""); setMode("topup"); setForm(emptyForm); setOpen(true); }}>Adjust Balance</Button>
        </div>
      </section>

      <section className="space-y-4">
        <div><p className="text-xs uppercase tracking-[0.22em] text-white/35">Current Position</p><h2 className="mt-2 text-2xl font-semibold text-white">Balance Breakdown</h2><p className="mt-2 text-sm text-white/45">Available Balance updates live as Indonesia RP orders are placed, edited, or cancelled.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard label="Available Balance" value={money(data.availableBalance)} detail="Live running balance" tone="teal" icon={Landmark} />
          <SummaryCard label="Today’s RP Orders" value={money(data.totalRpAmount)} detail="Indonesia orders placed today (for reference)" icon={ArrowDownRight} />
        </div>
      </section>

      <section className="glass-panel rounded-[32px] border border-white/5 p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-white/35">Audit Trail</p><h2 className="mt-2 text-2xl font-semibold text-white">Balance History</h2></div><p className="text-xs text-white/40">RP amount is calculated automatically for today.</p></div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/35"><tr><th className="px-3 py-3">Date &amp; Time</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-right">Amount (IDR)</th><th className="px-3 py-3 text-right">Balance (IDR)</th><th className="px-3 py-3">Updated By</th></tr></thead><tbody className="divide-y divide-white/5">{visibleHistory.map((entry) => <tr key={entry.id} className="text-white/75"><td className="whitespace-nowrap px-3 py-4 text-white/55">{formatDateTime(entry.date)}</td><td className="px-3 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${entry.amount >= 0 ? "bg-teal/10 text-teal" : "bg-red-400/10 text-red-300"}`}>{entry.amount >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{entry.type}</span></td><td className="px-3 py-4">{entry.description}</td><td className={`whitespace-nowrap px-3 py-4 text-right font-mono ${entry.amount >= 0 ? "text-teal" : "text-red-300"}`}>{entry.amount >= 0 ? "+ " : "- "}{money(Math.abs(entry.amount))}</td><td className="whitespace-nowrap px-3 py-4 text-right font-mono text-white">{money(entry.balance)}</td><td className="px-3 py-4 text-white/55">{entry.updatedBy}</td></tr>)}</tbody></table>
          {!data.history.length && <div className="py-10 text-center text-sm text-white/45">No balance transactions yet.</div>}
          {data.history.length > 0 && <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4"><p className="text-xs text-white/40">Page {historyPage} of {totalHistoryPages}</p><div className="flex gap-2"><button type="button" disabled={historyPage === 1} onClick={() => setHistoryPage((page) => page - 1)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={historyPage === totalHistoryPages} onClick={() => setHistoryPage((page) => page + 1)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="adjust-balance-title">
          <form onSubmit={saveAdjustment} noValidate className="dialog-surface w-full max-w-lg rounded-[28px] border border-gold/20 p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gold-light/70">Daily Entry</p>
                <h2 id="adjust-balance-title" className="mt-2 text-2xl font-semibold text-white">Adjust Bank Balance</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-white/55 hover:bg-white/10 hover:text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
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
                onClick={() => setMode("set")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${mode === "set" ? "bg-gradient-to-br from-gold-light via-gold to-[#a87620] text-dark-base shadow-[0_6px_18px_rgba(212,168,67,0.3)]" : "text-white/55 hover:text-white"}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Set Exact
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="balance-amount" className="mb-2 block text-sm font-medium text-white/75">
                  {mode === "topup" ? "Amount to Add" : "Today’s Bank Balance"}
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-dark-input pl-4 pr-3 focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20">
                  <span className="shrink-0 text-sm font-semibold text-white/35">Rp</span>
                  <input
                    id="balance-amount"
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.amount}
                    onChange={(event) => { setForm((current) => ({ ...current, amount: event.target.value })); if (message) setMessage(""); }}
                    placeholder="30,000"
                    className="w-full appearance-none bg-transparent py-3 font-mono text-base text-white outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Current</p>
                    <p className="mt-1 font-mono text-sm text-white/75">{money(data.availableBalance)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/30" />
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">New Balance</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-gold-light">{form.amount ? money(newBalancePreview) : "—"}</p>
                  </div>
                </div>

                {mode === "set" && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200/90">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    This replaces the current balance entirely instead of adding to it.
                  </p>
                )}
              </div>

              {message && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">{message}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}{saving ? "Saving..." : "Save Balance"}</Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
