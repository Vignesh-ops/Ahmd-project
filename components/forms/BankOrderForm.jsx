"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Landmark, RotateCcw, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RadioPill from "@/components/ui/RadioPill";
import { markOrderDone } from "@/lib/orderStatus";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { calculateTotalPayable, formatCurrency, formatNumber } from "@/lib/utils";

const countryOptions = [
  { label: "IDR", value: 1 },
  { label: "INR", value: 2 }
];

function getCountryDefaults(country, settings) {
  return country === 1
    ? { rate: settings.rate1, serviceCharge: settings.service1, label: "Indonesia" }
    : { rate: settings.rate2, serviceCharge: settings.service2, label: "India" };
}

function buildInitialForm(orderNo, settings, country = 1) {
  const defaults = getCountryDefaults(country, settings);

  return {
    orderNo,
    country,
    senderName: "",
    accountName: "",
    accountNo: "",
    bank: "",
    branch: "",
    ifscCode: "",
    depositAmount: "",
    rate: String(defaults.rate ?? ""),
    serviceCharge: String(defaults.serviceCharge ?? ""),
    senderMobile: "",
    notes: ""
  };
}

export default function BankOrderForm({ initialOrderNo, settings }) {
  const router = useRouter();
  const [form, setForm] = useState(() => buildInitialForm(initialOrderNo, settings));
  const [savedOrder, setSavedOrder] = useState(null);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [lookup, setLookup] = useState({
    status: "idle",
    message: ""
  });
  const [lookupChoices, setLookupChoices] = useState([]);
  const [lookupModal, setLookupModal] = useState({
    open: false,
    mobile: ""
  });

  const selectedCountrySettings = useMemo(() => getCountryDefaults(form.country, settings), [form.country, settings]);
  const totalPayableAmount = useMemo(
    () =>
      calculateTotalPayable({
        depositAmount: form.depositAmount,
        rate: form.rate,
        serviceCharge: form.serviceCharge
      }),
    [form.depositAmount, form.rate, form.serviceCharge]
  );

  function updateField(name, value) {
    setSavedOrder(null);
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateCountry(country) {
    const defaults = getCountryDefaults(country, settings);

    setSavedOrder(null);
    setForm((current) => ({
      ...current,
      country,
      rate: String(defaults.rate ?? ""),
      serviceCharge: String(defaults.serviceCharge ?? "")
    }));
  }

  function applyLookupSelection(selection, { preserveSenderName = true } = {}) {
    setSavedOrder(null);
    setForm((current) => {
      const currentDefaults = getCountryDefaults(current.country, settings);
      const nextCountry = selection.data.country || current.country;
      const nextDefaults = getCountryDefaults(nextCountry, settings);
      const shouldSyncPricing =
        nextCountry !== current.country &&
        String(current.rate ?? "") === String(currentDefaults.rate ?? "") &&
        String(current.serviceCharge ?? "") === String(currentDefaults.serviceCharge ?? "");

      return {
        ...current,
        country: nextCountry,
        senderName: preserveSenderName ? current.senderName || selection.data.senderName || "" : selection.data.senderName || "",
        accountName: selection.data.accountName || "",
        accountNo: selection.data.accountNo || "",
        bank: selection.data.bank || "",
        branch: selection.data.branch || "",
        ifscCode: selection.data.ifscCode || "",
        rate: shouldSyncPricing ? String(nextDefaults.rate ?? "") : current.rate,
        serviceCharge: shouldSyncPricing ? String(nextDefaults.serviceCharge ?? "") : current.serviceCharge
      };
    });

    setLookup({
      status: "success",
      message: `Loaded saved account ${selection.data.accountNo}${selection.storeCode ? ` · ${selection.storeCode}` : ""}.`
    });
    setLookupModal({
      open: false,
      mobile: ""
    });
  }

  function closeLookupModalForManualEntry() {
    setLookupModal({
      open: false,
      mobile: ""
    });
    setLookup({
      status: "idle",
      message: "Enter receiver details manually for this sender mobile."
    });
  }

  useEffect(() => {
    const mobile = form.senderMobile.trim();
    const normalizedMobile = mobile.replace(/\D/g, "");

    if (normalizedMobile.length < 10) {
      setLookupChoices([]);
      setLookupModal({
        open: false,
        mobile: ""
      });
      setLookup({
        status: "idle",
        message: ""
      });
      return undefined;
    }

    let ignore = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLookup({
          status: "loading",
          message: "Checking saved customer details..."
        });

        const response = await fetch(`/api/customers/lookup?type=bank&mobile=${encodeURIComponent(mobile)}`, {
          cache: "no-store"
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Could not fetch customer details.");
        }

        if (!payload.found) {
          if (!ignore) {
            setLookupChoices([]);
            setLookupModal({
              open: false,
              mobile: ""
            });
            setLookup({
              status: "empty",
              message: "No saved customer found for this mobile yet."
            });
          }
          return;
        }

        if (ignore) {
          return;
        }

        const matches = Array.isArray(payload.matches) && payload.matches.length ? payload.matches : [payload];
        setLookupChoices(matches);

        // if (matches.length === 1) {
        //   applyLookupSelection(matches[0]);
        //   return;
        // }

        setLookupModal({
          open: true,
          mobile
        });
        setLookup({
          status: "success",
          message: `Found ${matches.length} saved accounts for this mobile. Choose one to autofill or continue manually.`
        });
      } catch (error) {
        if (!ignore) {
          setLookupChoices([]);
          setLookupModal({
            open: false,
            mobile: ""
          });
          setLookup({
            status: "error",
            message: error.message || "Could not fetch customer details."
          });
        }
      }
    }, 450);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.senderMobile, settings]);

  async function fetchFreshOrderNo() {
    const response = await fetch("/api/orders/bank?preview=true");
    const payload = await response.json();
    return payload.orderNo;
  }

  async function startNewOrder() {
    const nextOrderNo = await fetchFreshOrderNo();
    setSavedOrder(null);
    setMessage("");
    setLookup({
      status: "idle",
      message: ""
    });
    setForm(buildInitialForm(nextOrderNo, settings));
  }

  async function persistOrder() {
    const response = await fetch("/api/orders/bank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        totalPayableAmount
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Could not save bank order.");
    }

    setSavedOrder(payload);
    setForm((current) => ({
      ...current,
      orderNo: payload.orderNo
    }));

    return payload;
  }

  async function syncDoneStatus(order, actionLabel) {
    try {
      const updatedOrder = await markOrderDone(order);
      setSavedOrder(updatedOrder);
      setMessage(`Order ${updatedOrder.orderNo} ${actionLabel} and marked done.`);
      return updatedOrder;
    } catch (error) {
      setSavedOrder(order);
      setMessage(`Order ${order.orderNo} ${actionLabel}, but status update failed: ${error.message}`);
      return order;
    }
  }

  async function handleAction(intent) {
    try {
      setLoading(intent);
      setMessage("");
      const order = savedOrder || (await persistOrder());

      if (intent === "save") {
        router.push(`/receipt/${order.orderNo}`);
        return;
      }

      if (intent === "share") {
        shareViaWhatsApp(formatBankMessage(order));
        await syncDoneStatus(order, "shared");
        return;
      }

      window.open(`/receipt/${order.orderNo}?autoprint=true`, "_blank", "noopener,noreferrer");
      await syncDoneStatus(order, "sent to print");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  const lookupTextClass =
    lookup.status === "error"
      ? "text-red-300"
      : lookup.status === "success"
        ? "text-teal"
        : "text-white/45";

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Bank Transfer</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Create bank order</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Sender details, pricing, and receiver details are saved together, so repeated mobile numbers can prefill the form on the next order.
            </p>
          </div>
          <div className="w-full rounded-[28px] border border-gold/20 bg-gold/10 px-5 py-4 md:max-w-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gold-light/75">Rate Setup</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {selectedCountrySettings.label} default rate {formatNumber(selectedCountrySettings.rate)}
            </p>
            <p className="text-sm text-white/55">Default service charge {formatNumber(selectedCountrySettings.serviceCharge)}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/30">
              <Calculator className="h-4 w-4 text-gold-light" />
              Current payable {totalPayableAmount ? formatCurrency(totalPayableAmount, "MYR") : "-"}
            </p>
          </div>
        </div>
      </div>

      {savedOrder ? (
        <div className="rounded-[28px] border border-teal/30 bg-teal/10 p-5 text-sm text-white/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-teal">Saved Order</p>
              <p className="mt-1 font-mono text-base text-white">{savedOrder.orderNo}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={ShieldCheck} href={`/receipt/${savedOrder.orderNo}`}>
                Open Receipt
              </Button>
              <Button variant="ghost" icon={RotateCcw} onClick={startNewOrder}>
                Create Another
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="grid-form two-col">
          <Input label="Order No" value={form.orderNo} readOnly mono />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white/80">Country</span>
            <div className="flex flex-wrap gap-2">
              {countryOptions.map((option) => (
                <RadioPill
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  checked={form.country === option.value}
                  onChange={(value) => updateCountry(value)}
                />
              ))}
            </div>
          </div>

          <Input
            label="Sender Name"
            placeholder="Customer full name"
            value={form.senderName}
            onChange={(event) => updateField("senderName", event.target.value)}
          />
          <div className="space-y-2">
            <Input
              label="Sender Mobile"
              type="tel"
              placeholder="10+ digits"
              value={form.senderMobile}
              onChange={(event) => updateField("senderMobile", event.target.value)}
            />
            <p className={`text-xs ${lookupTextClass}`}>
              {lookup.message || "Enter an existing sender mobile number to auto-fill saved sender and receiver details."}
            </p>
            {lookupChoices.length > 1 ? (
              <Button type="button" variant="ghost" className="min-h-0 self-start px-0 py-0 text-xs text-gold-light" onClick={() => setLookupModal({ open: true, mobile: form.senderMobile.trim() })}>
                View saved accounts
              </Button>
            ) : null}
          </div>

          <Input
            label="Account Name"
            placeholder="Receiver account name"
            value={form.accountName}
            onChange={(event) => updateField("accountName", event.target.value)}
          />
          <Input
            label="Account No"
            placeholder="1234 5678 9012 3456"
            value={form.accountNo}
            onChange={(event) => updateField("accountNo", event.target.value)}
            mono
          />
          <Input
            label="Bank Name"
            placeholder="BCA / SBI"
            value={form.bank}
            onChange={(event) => updateField("bank", event.target.value)}
          />
          <Input
            label="Deposit Amount"
            type="number"
            step="0.01"
            prefix={form.country === 1 ? "Rp" : "₹"}
            placeholder="0"
            value={form.depositAmount}
            onChange={(event) => updateField("depositAmount", event.target.value)}
          />

          {form.country === 2 ? (
            <>
              <Input
                label="Branch"
                placeholder="Chennai Main"
                value={form.branch}
                onChange={(event) => updateField("branch", event.target.value)}
              />
              <Input
                label="IFSC Code"
                placeholder="SBIN0001234"
                value={form.ifscCode}
                onChange={(event) => updateField("ifscCode", event.target.value)}
                mono
              />
            </>
          ) : null}

          <Input
            label="Rate"
            hint="From store settings by default"
            type="number"
            step="0.01"
            placeholder="0"
            value={form.rate}
            onChange={(event) => updateField("rate", event.target.value)}
          />
          <Input
            label="Service Charge"
            type="number"
            step="0.01"
            placeholder="0"
            value={form.serviceCharge}
            onChange={(event) => updateField("serviceCharge", event.target.value)}
          />
          <Input
            label="Total Payable Amount (RM)"
            hint="Calculated as deposit amount / rate + service charge"
            value={totalPayableAmount ? formatCurrency(totalPayableAmount, "MYR") : ""}
            readOnly
            className="md:col-span-2"
            inputClassName="font-semibold text-gold-light"
          />

          <Input
            label="Notes"
            placeholder="Optional notes"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            textarea
            className="md:col-span-2"
            rows={4}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Button
              type="button"
              icon={Landmark}
              loading={loading === "save"}
              onClick={() => handleAction("save")}
              fullWidth
            >
              Save Order
            </Button>
            {/* <Button
              type="button"
              variant="secondary"
              icon={Send}
              loading={loading === "share"}
              onClick={() => handleAction("share")}
              fullWidth
            >
              WhatsApp Share
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={Printer}
              loading={loading === "print"}
              onClick={() => handleAction("print")}
              fullWidth
            >
              Print
            </Button> */}
          </div>
          <p className="text-sm text-white/55">{message || "Save first to generate a permanent order and receipt."}</p>
        </div>
      </div>

      {lookupModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-[32px] border border-white/10 p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-gold-light/80">Saved Accounts</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Choose a saved receiver account</h2>
            <p className="mt-2 text-sm text-white/60">
              Multiple receiver accounts were found for {lookupModal.mobile || form.senderMobile}. Select one to autofill the form, or continue with manual entry.
            </p>

            <div className="mt-5 space-y-3 h-[45vh] overflow-y-auto">
              {lookupChoices.map((choice) => (
                <button
                  key={`${choice.data.accountNo}-${choice.orderNo}`}
                  type="button"
                  className="w-full rounded-[24px] border border-white/10 bg-white/5 p-4 text-left transition hover:border-gold/30 hover:bg-white/10"
                  onClick={() => applyLookupSelection(choice)}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{choice.data.accountName || "Unnamed Account"}</p>
                      <p className="mt-1 font-mono text-sm text-gold-light">{choice.data.accountNo}</p>
                      <p className="mt-1 text-sm text-white/65">
                        {[choice.data.bank, choice.data.branch, choice.data.ifscCode].filter(Boolean).join(" · ") || "Bank details saved"}
                      </p>
                    </div>
                    <div className="text-left text-xs text-white/45 sm:text-right">
                      <p>{choice.storeCode || "Store"}</p>
                      <p>{choice.orderNo}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeLookupModalForManualEntry}>
                Fill Manually
              </Button>
              <Button type="button" variant="ghost" onClick={() => setLookupModal({ open: false, mobile: "" })}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
