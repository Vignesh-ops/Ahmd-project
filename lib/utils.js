export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

export function formatCurrency(value, currency = "IDR") {
  const amount = Number(value || 0);

  if (currency === "MYR") {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
      maximumFractionDigits: 2
    }).format(amount);
  }

  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(value, maximumFractionDigits = 2) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(amount);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateTotalPayable({ depositAmount, rate, serviceCharge }) {
  const amount = parseNumber(depositAmount, 0);
  const parsedRate = parseNumber(rate, 0);
  const parsedServiceCharge = parseNumber(serviceCharge, 0);

  if (amount <= 0 || parsedRate <= 0) {
    return 0;
  }

  const basePayable = amount / parsedRate;
  return basePayable + parsedServiceCharge;
}

export function exportCsv(filename, rows) {
  if (typeof window === "undefined") {
    return;
  }

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  const csv = `\uFEFF${csvContent}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
