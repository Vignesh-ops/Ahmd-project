"use client";

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function canUseNativeShare() {
  return Capacitor.isNativePlatform();
}

function bytesToBase64(bytes) {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return "";
  }
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

async function saveAndShareFile(filename, data) {
  const exportPath = `exports/${filename}`;

  await Filesystem.mkdir({
    path: "exports",
    directory: Directory.Cache,
    recursive: true
  }).catch(() => {});

  await Filesystem.writeFile({
    path: exportPath,
    data,
    directory: Directory.Cache
  });

  const result = await Filesystem.getUri({
    path: exportPath,
    directory: Directory.Cache
  });

  await Share.share({
    title: filename,
    text: filename,
    files: [result.uri],
    dialogTitle: "Share export"
  });

  return result;
}

export async function exportCsv(filename, rows) {
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

  if (canUseNativeShare()) {
    const bytes = new TextEncoder().encode(csv);
    const data = bytesToBase64(bytes);
    if (!data) {
      return;
    }
    await saveAndShareFile(filename, data);
    return;
  }

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
  if (canUseNativeShare()) {
    const data = XLSX.write(workbook, { bookType: "xlsx", type: "base64", compression: true });
    await saveAndShareFile(filename, data);
    return;
  }

  XLSX.writeFile(workbook, filename, { compression: true });
}
