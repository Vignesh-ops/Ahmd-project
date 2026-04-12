export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

const CURRENCY_FORMATS = {
  MYR: { locale: "ms-MY", currency: "MYR", plainPrefix: "RM", maximumFractionDigits: 2 },
  INR: { locale: "en-IN", currency: "INR", plainPrefix: "INR", maximumFractionDigits: 5 },
  IDR: { locale: "en-US", currency: "IDR", plainPrefix: "Rp", maximumFractionDigits: 5 }
};

function resolveCurrencyConfig(currency = "IDR") {
  return CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.IDR;
}

function getFractionDigits(value, fallbackMaximumFractionDigits = 2) {
  const rawValue = String(value ?? "").trim().replace(/,/g, "");
  const match = rawValue.match(/\.(\d+)/);

  if (!match) {
    return 0;
  }

  return Math.min(match[1].length, fallbackMaximumFractionDigits);
}

function getCurrencyDigits(value, currency = "IDR", options = {}) {
  const config = resolveCurrencyConfig(currency);
  const minimumFractionDigits = options.minimumFractionDigits ?? getFractionDigits(value, config.maximumFractionDigits);
  const maximumFractionDigits = Math.max(
    minimumFractionDigits,
    options.maximumFractionDigits ?? config.maximumFractionDigits
  );

  return {
    minimumFractionDigits,
    maximumFractionDigits
  };
}

export function formatCurrency(value, currency = "IDR", options = {}) {
  const amount = Number(value || 0);
  const config = resolveCurrencyConfig(currency);
  const digits = getCurrencyDigits(value, currency, options);
  if (currency === "IDR") {
    return `${config.plainPrefix} ${new Intl.NumberFormat("en-US", digits).format(amount)}`;
  }

  const currencyDisplay = options.currencyDisplay;

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    ...(currencyDisplay ? { currencyDisplay } : {}),
    ...digits
  }).format(amount);
}

export function formatCurrencyPlain(value, currency = "IDR", options = {}) {
  const amount = Number(value || 0);
  const config = resolveCurrencyConfig(currency);
  const digits = getCurrencyDigits(value, currency, options);
  if (currency === "IDR") {
    return `${config.plainPrefix} ${new Intl.NumberFormat("en-US", digits).format(amount)}`;
  }

  return `${config.plainPrefix} ${new Intl.NumberFormat(config.locale, digits).format(amount)}`;
}

export function formatNumber(value, maximumFractionDigits = 2, minimumFractionDigits = 0) {
  const amount = Number(value || 0);
  const resolvedMinimumFractionDigits = Math.min(minimumFractionDigits, maximumFractionDigits);

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: resolvedMinimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
}

export function formatPreciseNumber(value, maximumFractionDigits = 5) {
  return formatNumber(value, maximumFractionDigits, getFractionDigits(value, maximumFractionDigits));
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
  const normalized = String(value ?? "").trim().replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateTotalPayable({ depositAmount, rate, serviceCharge }) {
  const amount = parseNumber(depositAmount, 0);
  const parsedRate = parseNumber(rate, 0);
  const parsedServiceCharge = parseNumber(serviceCharge, 0);

  if (amount <= 0 || parsedRate <= 0) {
    return 0;
  }

  const basePayable = amount * parsedRate;
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

export async function exportXlsx(filename, rows, sheetName = "Report") {
  if (typeof window === "undefined") {
    return;
  }

  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = rows[0]?.map((_, columnIndex) => {
    const width = rows.reduce((max, row) => {
      const cellLength = String(row[columnIndex] ?? "").length;
      return Math.max(max, cellLength);
    }, 10);

    return { wch: Math.min(width + 2, 32) };
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename, { compression: true });
}
