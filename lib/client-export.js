"use client";

import { Capacitor } from "@capacitor/core";
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

function canUseNativePlatform() {
  return Capacitor.isNativePlatform();
}

export async function exportCsv(_filename, _rows) {
  // CSV export removed from admin flow.
}

export async function exportXlsx(filename, rows) {
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  const wbout = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64"
  });

  const file = await Filesystem.writeFile({
    path: filename,
    data: wbout,
    directory: Directory.Cache // temp location
  });

  await Share.share({
    title: "Export XLSX",
    text: "Here is your exported file",
    url: file.uri
  });

  return { shared: true };
}
function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
export async function exportXlsx(filename, rows) {
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  const wbout = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array"
  });

  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  downloadFile(blob, filename);

  return { downloaded: true };
}
