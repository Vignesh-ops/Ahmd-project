"use client";

import { Capacitor } from "@capacitor/core";

function downloadBlob(filename, blob) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function canUseNativePlatform() {
  return Capacitor.isNativePlatform();
}

export async function exportCsv(_filename, _rows) {
  // CSV export removed from admin flow.
}

// export async function exportXlsx(filename, rows, sheetName = "Report") {
//   if (typeof window === "undefined") {
//     return;
//   }

//   const XLSX = await import("xlsx");
//   const worksheet = XLSX.utils.aoa_to_sheet(rows);
//   const workbook = XLSX.utils.book_new();

//   worksheet["!cols"] = rows[0]?.map((_, columnIndex) => {
//     const width = rows.reduce((max, row) => {
//       const cellLength = String(row[columnIndex] ?? "").length;
//       return Math.max(max, cellLength);
//     }, 10);

//     return { wch: Math.min(width + 2, 32) };
//   });

//   XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

//   if (canUseNativePlatform()) {
//     const [{ Filesystem, Directory }] = await Promise.all([import("@capacitor/filesystem")]);
//     const base64Data = XLSX.write(workbook, { bookType: "xlsx", type: "base64", compression: true });
//     const exportPath = `exports/${filename}`;

//     await Filesystem.mkdir({
//       path: "exports",
//       directory: Directory.Documents,
//       recursive: true
//     }).catch(() => {});

//     await Filesystem.writeFile({
//       path: exportPath,
//       data: base64Data,
//       directory: Directory.Documents,
//       recursive: true
//     });

//     return { saved: true, path: exportPath };
//   }

//   const data = XLSX.write(workbook, { bookType: "xlsx", type: "array", compression: true });
//   const blob = new Blob([data], {
//     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   });
//   downloadBlob(filename, blob);
//   return { saved: true };
// }
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
