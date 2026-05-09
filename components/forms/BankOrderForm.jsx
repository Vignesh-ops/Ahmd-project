"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Landmark, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RadioPill from "@/components/ui/RadioPill";
import { markOrderDone } from "@/lib/orderStatus";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { openInAppOrTab } from "@/lib/native";
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

function normalizeAccountNo(value) {
  return String(value ?? "").replace(/\s+/g, "");
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function buildInitialForm(orderNo, settings, country = 1) {
  const defaults = getCountryDefaults(country, settings);
  const initialTotalPayableAmount = calculateTotalPayable({
    depositAmount: "",
    rate: defaults.rate,
    serviceCharge: defaults.serviceCharge
  });

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
    totalPayableAmount: initialTotalPayableAmount > 0 ? String(initialTotalPayableAmount) : "",
    senderMobile: "",
    notes: ""
  };
}

function buildFormFromOrder(order, settings) {
  if (!order) {
    return buildInitialForm("", settings);
  }

  return {
    orderNo: order.orderNo,
    country: Number(order.country || 1),
    senderName: order.senderName || "",
    accountName: order.accountName || "",
    accountNo: normalizeAccountNo(order.accountNo),
    bank: order.bank || "",
    branch: order.branch || "",
    ifscCode: order.ifscCode || "",
    depositAmount: String(order.depositAmount ?? order.amount ?? ""),
    rate: String(order.rate ?? ""),
    serviceCharge: String(order.serviceCharge ?? ""),
    totalPayableAmount: String(order.totalPayableAmount ?? ""),
    senderMobile: order.senderMobile || "",
    notes: order.notes || ""
  };
}

export default function BankOrderForm({ initialOrderNo, settings, initialOrder = null }) {
  const router = useRouter();
  const isEditing = Boolean(initialOrder);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(() =>
    initialOrder ? buildFormFromOrder(initialOrder, settings) : buildInitialForm(initialOrderNo, settings)
  );
  const [savedOrder, setSavedOrder] = useState(initialOrder);
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
  const [deletingSuggestion, setDeletingSuggestion] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmChoice, setDeleteConfirmChoice] = useState(null);
  const [deleteConfirmError, setDeleteConfirmError] = useState(null);

  const selectedCountrySettings = useMemo(() => getCountryDefaults(form.country, settings), [form.country, settings]);
  const calculatedTotalPayableAmount = useMemo(
    () =>
      calculateTotalPayable({
        depositAmount: form.depositAmount,
        rate: form.rate,
        serviceCharge: form.serviceCharge
      }),
    [form.depositAmount, form.rate, form.serviceCharge]
  );

  function formatCalculatedTotalPayable(amount) {
    if (!(amount > 0)) {
      return "";
    }

    const truncatedAmount = Math.trunc(amount * 1000) / 1000;
    console.log('truncatedAmoun', truncatedAmount)
    return truncatedAmount.toString();
  }

  function updateField(name, value) {
    const nextValue = name === "accountNo" ? normalizeAccountNo(value) : value;
    setSavedOrder(null);
    setForm((current) => ({
      ...current,
      [name]: nextValue
    }));
  }

  function updateDecimalField(name, value) {
    const normalized = String(value).replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(normalized)) {
      return;
    }
    updateField(name, normalized);
  }

  function updatePricingField(name, value) {
    const normalized = String(value).replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(normalized)) {
      return;
    }

    setSavedOrder(null);
    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: normalized
      };

      return {
        ...nextForm,
        totalPayableAmount: formatCalculatedTotalPayable(
          calculateTotalPayable({
            depositAmount: nextForm.depositAmount,
            rate: nextForm.rate,
            serviceCharge: nextForm.serviceCharge
          })
        )
      };
    });
  }

  async function updateCountry(country) {
    const defaults = getCountryDefaults(country, settings);

    setSavedOrder(null);
    setForm((current) => {
      const nextTotalPayableAmount = calculateTotalPayable({
        depositAmount: current.depositAmount,
        rate: defaults.rate,
        serviceCharge: defaults.serviceCharge
      });

      return {
        ...current,
        country,
        rate: String(defaults.rate ?? ""),
        serviceCharge: String(defaults.serviceCharge ?? ""),
        totalPayableAmount: formatCalculatedTotalPayable(nextTotalPayableAmount)
      };
    });

    if (!isEditing) {
      const nextOrderNo = await fetchFreshOrderNo(country);
      setForm((current) => ({
        ...current,
        orderNo: nextOrderNo
      }));
    }
  }

  function applyLookupSelection(selection, { preserveSenderName = true } = {}) {
    let nextOrderNoCountry = null;

    setSavedOrder(null);
    setForm((current) => {
      const currentDefaults = getCountryDefaults(current.country, settings);
      const nextCountry = selection.data.country || current.country;
      const nextDefaults = getCountryDefaults(nextCountry, settings);
      nextOrderNoCountry = !isEditing && nextCountry !== current.country ? nextCountry : null;
      const shouldSyncPricing =
        nextCountry !== current.country &&
        String(current.rate ?? "") === String(currentDefaults.rate ?? "") &&
        String(current.serviceCharge ?? "") === String(currentDefaults.serviceCharge ?? "");

      return {
        ...current,
        country: nextCountry,
        senderName: preserveSenderName ? current.senderName || selection.data.senderName || "" : selection.data.senderName || "",
        accountName: selection.data.accountName || "",
        accountNo: normalizeAccountNo(selection.data.accountNo),
        bank: selection.data.bank || "",
        branch: selection.data.branch || "",
        ifscCode: selection.data.ifscCode || "",
        rate: shouldSyncPricing ? String(nextDefaults.rate ?? "") : current.rate,
        serviceCharge: shouldSyncPricing ? String(nextDefaults.serviceCharge ?? "") : current.serviceCharge,
        totalPayableAmount: shouldSyncPricing
          ? formatCalculatedTotalPayable(
            calculateTotalPayable({
              depositAmount: current.depositAmount,
              rate: nextDefaults.rate,
              serviceCharge: nextDefaults.serviceCharge
            })
          )
          : current.totalPayableAmount
      };
    });

    if (nextOrderNoCountry) {
      fetchFreshOrderNo(nextOrderNoCountry).then((nextOrderNo) => {
        setForm((current) => ({
          ...current,
          orderNo: nextOrderNo
        }));
      });
    }

    setLookup({
      status: "success",
      message: `Loaded saved account ${normalizeAccountNo(selection.data.accountNo)}${selection.storeCode ? ` · ${selection.storeCode}` : ""}.`
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

  async function deleteLookupChoice(choice) {
    setDeleteConfirmChoice(choice);
    setShowDeleteConfirm(true);
    setDeleteConfirmError(null);
  }

  async function confirmDeleteLookupChoice() {
    if (!deleteConfirmChoice) return;

    const choice = deleteConfirmChoice;
    const signature = choice?.signature;
    const mobile = lookupModal.mobile || form.senderMobile;

    if (!signature) {
      return;
    }

    try {
      setDeletingSuggestion(signature);
      const response = await fetch("/api/customers/lookup", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "bank",
          mobile,
          signature
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete saved customer suggestion.");
      }

      setLookupChoices((current) => {
        const remaining = current.filter((item) => item.signature !== signature);

        if (!remaining.length) {
          setLookupModal({
            open: false,
            mobile: ""
          });
          setLookup({
            status: "empty",
            message: "No saved customer found for this mobile yet."
          });
        } else {
          setLookup({
            status: "success",
            message: `Found ${remaining.length} saved accounts for this mobile. Choose one to autofill or continue manually.`
          });
        }

        return remaining;
      });
      
      setShowDeleteConfirm(false);
      setDeleteConfirmChoice(null);
    } catch (error) {
      setDeleteConfirmError(error.message || "Could not delete saved customer suggestion.");
    } finally {
      setDeletingSuggestion("");
    }
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
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLookup({
          status: "loading",
          message: "Checking saved customer details..."
        });

        const response = await fetch(`/api/customers/lookup?type=bank&mobile=${encodeURIComponent(mobile)}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const payload = await readJsonResponse(response);

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
        if (error.name === "AbortError") {
          return;
        }
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
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [form.senderMobile]);

  async function fetchFreshOrderNo(country = form.country) {
    const response = await fetch(`/api/orders/bank?preview=true&country=${country}`);
      const payload = await readJsonResponse(response);
    return payload.orderNo;
  }

  async function startNewOrder() {
    setSavedOrder(null);
    setMessage("");
    setLookup({
      status: "idle",
      message: ""
    });
    setLookupChoices([]);
    setLookupModal({
      open: false,
      mobile: ""
    });
    setForm((current) => ({
      ...buildInitialForm(current.orderNo, settings, current.country),
      rate: current.rate,
      serviceCharge: current.serviceCharge
    }));
  }

  async function persistOrder() {
    const response = await fetch(isEditing ? `/api/orders/bank/${initialOrder.id}` : "/api/orders/bank", {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        accountNo: normalizeAccountNo(form.accountNo),
        totalPayableAmount: Number(form.totalPayableAmount || 0)
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
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const order = savedOrder || (await persistOrder());

      if (intent === "save") {
        router.push(`/receipt/${order.orderNo}`);
        return;
      }

      if (intent === "share") {
        const sharePromise = shareViaWhatsApp(formatBankMessage(order));
        await syncDoneStatus(order, "shared");
        await sharePromise;
        return;
      }

      openInAppOrTab(`/receipt/${order.orderNo}?autoprint=true`);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayDefaultRate = mounted ? formatNumber(selectedCountrySettings.rate, 5) : String(selectedCountrySettings.rate ?? "");
  const displayDefaultServiceCharge = mounted
    ? formatNumber(selectedCountrySettings.serviceCharge, 5)
    : String(selectedCountrySettings.serviceCharge ?? "");
  const displayCurrentPayable = calculatedTotalPayableAmount
    ? mounted
      ? formatCurrency(calculatedTotalPayableAmount, "MYR")
      : String(calculatedTotalPayableAmount)
    : "-";


  function handleClearForm() {
    setSavedOrder(null);
    setMessage("");
    setLookup({
      status: "idle",
      message: ""
    });
    setLookupChoices([]);
    setLookupModal({
      open: false,
      mobile: ""
    });
    setForm((current) => ({
      orderNo: current.orderNo,
      country: current.country,
      rate: current.rate,
      serviceCharge: current.serviceCharge,
      totalPayableAmount: "",
      senderName: "",
      accountName: "",
      accountNo: "",
      bank: "",
      branch: "",
      ifscCode: "",
      depositAmount: "",
      senderMobile: "",
      notes: ""
    }));
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Bank Transfer</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {isEditing ? "Edit bank order" : "Create bank order"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              {isEditing
                ? "Update the order details and refresh its receipt."
                : "Sender details, pricing, and receiver details are saved together, so repeated mobile numbers can prefill the form on the next order."}
            </p>
          </div>
          <div className="w-full rounded-[28px] border border-gold/20 bg-gold/10 px-5 py-4 md:max-w-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gold-light/75">Rate Setup</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {selectedCountrySettings.label} default rate {displayDefaultRate}
            </p>
            <p className="text-sm text-white/55">Default service charge {displayDefaultServiceCharge}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/30">
              <Calculator className="h-4 w-4 text-gold-light" />
              Current payable {displayCurrentPayable}
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
              {!isEditing ? (
                <Button variant="ghost" icon={RotateCcw} onClick={startNewOrder}>
                  Create Another
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleClearForm}
            className="self-end p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Clear form fields (keeps Rate, Service Charge, and Order Number)"
          >
            <RotateCcw size={20} className="text-gold-light" />
          </button>
        </div>
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
            type="text"
            inputMode="decimal"
            prefix={form.country === 1 ? "Rp" : "₹"}
            placeholder="0"
            value={form.depositAmount}
            onChange={(event) => updatePricingField("depositAmount", event.target.value)}
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
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={form.rate}
            onChange={(event) => updatePricingField("rate", event.target.value)}
          />
          <Input
            label="Service Charge"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={form.serviceCharge}
            onChange={(event) => updatePricingField("serviceCharge", event.target.value)}
          />
          <Input
            label="Total Payable Amount (RM)"
            hint="Calculated as deposit amount * rate + service charge"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={form.totalPayableAmount}
            onChange={(event) => updateDecimalField("totalPayableAmount", event.target.value)}
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
              icon={isEditing ? Save : Landmark}
              loading={loading === "save"}
              onClick={() => handleAction("save")}
              fullWidth
            >
              {isEditing ? "Update Order" : "Save Order"}
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
          <p className="text-sm text-white/55">
            {message ||
              (isEditing
                ? "Update the order to refresh its receipt."
                : "Save first to generate a permanent order and receipt.")}
          </p>
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
                <div
                  key={`${choice.data.accountNo}-${choice.orderNo}`}
                  className="flex w-full items-stretch overflow-hidden rounded-[24px] border border-white/10 bg-white/5 transition hover:border-gold/30 hover:bg-white/10"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 p-5 text-left transition hover:bg-white/5"
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
                  <div className="flex flex-col items-center justify-center border-l border-white/10 px-3 py-2">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Delete saved account ${choice.data.accountName || choice.data.accountNo || ""}`.trim()}
                      title="Delete saved suggestion"
                      disabled={deletingSuggestion === choice.signature}
                      onClick={() => deleteLookupChoice(choice)}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
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

      {showDeleteConfirm && deleteConfirmChoice ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel w-full max-w-sm rounded-[28px] border border-red-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-10a8 8 0 100 16 8 8 0 000-16z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Saved Account?</h3>
            </div>

            <p className="text-white/60 mb-6">
              Are you sure you want to delete <span className="font-semibold text-red-300">{deleteConfirmChoice.data.accountName || deleteConfirmChoice.data.accountNo}</span>? This action cannot be undone.
            </p>

            {deleteConfirmError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {deleteConfirmError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmChoice(null);
                  setDeleteConfirmError(null);
                }}
                disabled={deletingSuggestion === deleteConfirmChoice.signature}
                className="dialog-secondary-button flex-1 rounded-[20px] bg-white/10 px-4 py-2 text-white transition-colors disabled:opacity-50 hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteLookupChoice}
                disabled={deletingSuggestion === deleteConfirmChoice.signature}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-[20px] transition-colors font-medium flex items-center justify-center gap-2"
              >
                {deletingSuggestion === deleteConfirmChoice.signature ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-white">Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 text-red-100" />
                    <span className="text-white">Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
