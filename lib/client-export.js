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