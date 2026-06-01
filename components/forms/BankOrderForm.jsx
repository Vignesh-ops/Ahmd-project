"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Banknote,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  Globe2,
  Hash,
  Landmark,
  MapPin,
  ReceiptText,
  Search,
  Settings2,
  Smartphone,
  User,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RadioPill from "@/components/ui/RadioPill";
import { markOrderDone } from "@/lib/orderStatus";
import { cacheReceiptOrder } from "@/lib/receipt-cache";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { calculateTotalPayable, digitsOnly, formatCurrency, formatNumber, lettersAndSpacesOnly } from "@/lib/utils";

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
  return digitsOnly(value);
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
    senderName: lettersAndSpacesOnly(order.senderName || ""),
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
  const [lookupSearch, setLookupSearch] = useState("");
  const [deletingSuggestion, setDeletingSuggestion] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmChoice, setDeleteConfirmChoice] = useState(null);
  const [deleteConfirmError, setDeleteConfirmError] = useState(null);
  const actionInFlightRef = useRef(false);
  const savedOrderRef = useRef(initialOrder);

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
  const visibleLookupChoices = useMemo(() => {
    const query = lookupSearch.trim().toLowerCase();

    return [...lookupChoices]
      .sort((left, right) => {
        const leftName = left?.data?.accountName || left?.data?.accountNo || "";
        const rightName = right?.data?.accountName || right?.data?.accountNo || "";
        const nameCompare = leftName.localeCompare(rightName, undefined, { sensitivity: "base", numeric: true });

        if (nameCompare !== 0) {
          return nameCompare;
        }

        return String(left?.data?.accountNo || "").localeCompare(String(right?.data?.accountNo || ""), undefined, {
          sensitivity: "base",
          numeric: true
        });
      })
      .filter((choice) => {
        if (!query) {
          return true;
        }

        const searchable = [
          choice?.data?.accountName,
          choice?.data?.accountNo,
          choice?.data?.bank,
          choice?.data?.branch,
          choice?.data?.ifscCode,
          choice?.storeCode,
          choice?.orderNo
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
  }, [lookupChoices, lookupSearch]);

  function formatCalculatedTotalPayable(amount) {
    if (!(amount > 0)) {
      return "";
    }

    const truncatedAmount = Math.trunc(amount * 1000) / 1000;
    return truncatedAmount.toString();
  }

  function updateField(name, value) {
    const nextValue =
      name === "accountNo"
        ? normalizeAccountNo(value)
        : name === "senderMobile"
          ? digitsOnly(value)
          : name === "senderName"
            ? lettersAndSpacesOnly(value)
          : value;
    savedOrderRef.current = null;
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

    savedOrderRef.current = null;
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

    savedOrderRef.current = null;
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

    savedOrderRef.current = null;
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
        senderName: lettersAndSpacesOnly(
          preserveSenderName ? current.senderName || selection.data.senderName || "" : selection.data.senderName || ""
        ),
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
    setLookupSearch("");
  }

  function closeLookupModalForManualEntry() {
    setLookupModal({
      open: false,
      mobile: ""
    });
    setLookupSearch("");
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
          setLookupSearch("");
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
      setLookupSearch("");
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
            setLookupSearch("");
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
        setLookupSearch("");
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
          setLookupSearch("");
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
    savedOrderRef.current = null;
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
    setLookupSearch("");
    const nextOrderNo = await fetchFreshOrderNo(form.country);
    setForm((current) => ({
      ...buildInitialForm(nextOrderNo, settings, current.country),
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

    savedOrderRef.current = payload;
    setSavedOrder(payload);
    setForm(buildFormFromOrder(payload, settings));
    cacheReceiptOrder(payload);

    return payload;
  }

  async function syncDoneStatus(order, actionLabel) {
    try {
      const updatedOrder = await markOrderDone(order);
      savedOrderRef.current = updatedOrder;
      setSavedOrder(updatedOrder);
      setMessage(`Order ${updatedOrder.orderNo} ${actionLabel} and marked done.`);
      return updatedOrder;
    } catch (error) {
      savedOrderRef.current = order;
      setSavedOrder(order);
      setMessage(`Order ${order.orderNo} ${actionLabel}, but status update failed: ${error.message}`);
      return order;
    }
  }

  async function handleAction(intent) {
    if (actionInFlightRef.current) {
      return;
    }

    try {
      actionInFlightRef.current = true;
      setLoading(intent);
      setMessage("");
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const order = savedOrderRef.current || (await persistOrder());
      cacheReceiptOrder(order);

      if (intent === "save") {
        router.push(`/receipt/${order.orderNo}`);
        return;
      }

      if (intent === "share") {
        const result = await shareViaWhatsApp(formatBankMessage(order));
        if (order.status === "done") {
          setMessage(`Order ${order.orderNo} shared.`);
        } else if (result.returned && window.confirm("Have you successfully shared the order?")) {
          await syncDoneStatus(order, "shared");
        } else {
          setMessage("Share not confirmed. Order status remains pending.");
        }
        return;
      }

      router.push(`/receipt/${order.orderNo}?autoprint=true`);
      setMessage("Print opened. Order status will update only after a successful print.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      actionInFlightRef.current = false;
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

  useEffect(() => {
    const nextForm = initialOrder
      ? buildFormFromOrder(initialOrder, settings)
      : buildInitialForm(initialOrderNo, settings);

    savedOrderRef.current = initialOrder;
    setSavedOrder(initialOrder);
    setForm(nextForm);
  }, [initialOrder, initialOrderNo, settings]);

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
    savedOrderRef.current = null;
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
    setLookupSearch("");
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
            className="self-end px-4 py-2 bg-gold/20 border border-gold/40 hover:bg-gold/30 rounded-[20px] transition-colors flex items-center gap-2"
            title="Clear form fields (keeps Rate, Service Charge, and Order Number)"
          >
            <RotateCcw size={20} className="text-gold-light" />
            <span className="text-sm text-gold-light">Reset</span>
          </button>
        </div>
        <div className="grid-form two-col">
          <Input label="Order No" icon={Hash} value={form.orderNo} readOnly mono />

          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-white/80">
              <Globe2 className="h-4 w-4 text-gold-light" />
              Country
            </span>
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
            icon={User}
            placeholder="Customer full name"
            value={form.senderName}
            pattern="[\p{L} ]*"
            onChange={(event) => updateField("senderName", event.target.value)}
          />
          <div className="space-y-2">
            <Input
              label="Sender Mobile"
              icon={Smartphone}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="10+ digits"
              value={form.senderMobile}
              onChange={(event) => updateField("senderMobile", event.target.value)}
            />
            <p className={`text-xs ${lookupTextClass}`}>
              {lookup.message || "Enter an existing sender mobile number to auto-fill saved sender and receiver details."}
            </p>
            {lookupChoices.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-0 self-start px-0 py-0 text-xs text-gold-light"
                onClick={() => {
                  setLookupSearch("");
                  setLookupModal({ open: true, mobile: form.senderMobile.trim() });
                }}
              >
                View saved accounts
              </Button>
            ) : null}
          </div>

          <Input
            label="Account Name"
            icon={User}
            placeholder="Receiver account name"
            value={form.accountName}
            onChange={(event) => updateField("accountName", event.target.value)}
          />
          <Input
            label="Account No"
            icon={CreditCard}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1234567890123456"
            value={form.accountNo}
            onChange={(event) => updateField("accountNo", event.target.value)}
            mono
          />
          <Input
            label="Bank Name"
            icon={Landmark}
            placeholder="BCA / SBI"
            value={form.bank}
            onChange={(event) => updateField("bank", event.target.value)}
          />
          <Input
            label="Deposit Amount"
            icon={Banknote}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={form.depositAmount}
            onChange={(event) => updatePricingField("depositAmount", event.target.value)}
          />

          {form.country === 2 ? (
            <>
              <Input
                label="Branch"
                icon={Building2}
                placeholder="Chennai Main"
                value={form.branch}
                onChange={(event) => updateField("branch", event.target.value)}
              />
              <Input
                label="IFSC Code"
                icon={MapPin}
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
            icon={BadgeDollarSign}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={form.rate}
            onChange={(event) => updatePricingField("rate", event.target.value)}
          />
          <Input
            label="Service Charge"
            icon={Settings2}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={form.serviceCharge}
            onChange={(event) => updatePricingField("serviceCharge", event.target.value)}
          />
          <Input
            label="Total Payable Amount (RM)"
            hint="Calculated as deposit amount * rate + service charge"
            icon={ReceiptText}
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
            icon={FileText}
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
              disabled={Boolean(loading)}
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

            <Input
              label="Search"
              icon={Search}
              type="search"
              placeholder="Name, account no, bank, IFSC, store..."
              value={lookupSearch}
              onChange={(event) => setLookupSearch(event.target.value)}
              className="mt-5"
            />

            <div className="mt-4 h-[45vh] space-y-3 overflow-y-auto">
              {visibleLookupChoices.map((choice) => (
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
              {!visibleLookupChoices.length ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/55">
                  No saved account matches your search.
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeLookupModalForManualEntry}>
                Fill Manually
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLookupModal({ open: false, mobile: "" });
                  setLookupSearch("");
                }}
              >
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
