"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";
import { isNativeCapacitor } from "./native";

const DocumentSaver = registerPlugin("DocumentSaver");
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function exportCsv(_filename, _rows) {
  // CSV export removed from admin flow.
}

function normalizeXlsxFilename(filename) {
  const trimmed = String(filename || "Data.xlsx").trim();
  return trimmed.toLowerCase().endsWith(".xlsx") ? trimmed : `${trimmed}.xlsx`;
}

function isPickerCancel(error) {
  return error?.name === "AbortError" || /cancel/i.test(error?.message || "");
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Could not prepare file data."));
    reader.readAsDataURL(blob);
  });
}

function createWorkbookBlob(rows, sheetName = "Orders") {
  return import("xlsx").then((XLSX) => {
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    worksheet["!cols"] = rows[0]?.map((_, columnIndex) => {
      const width = rows.reduce((max, row) => {
        const cellLength = String(row[columnIndex] ?? "").length;
        return Math.max(max, cellLength);
      }, 10);

      return { wch: Math.min(width + 2, 36) };
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const output = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      compression: true
    });

    return new Blob([output], { type: XLSX_MIME });
  });
}

function canUseNativeDocumentSaver() {
  return isNativeCapacitor() && Capacitor.isPluginAvailable("DocumentSaver");
}

async function pickNativeXlsxTarget(filename) {
  const result = await DocumentSaver.createFile({
    fileName: filename,
    mimeType: XLSX_MIME
  });

  if (result?.canceled) {
    return {
      canceled: true,
      filename,
      message: "Save cancelled."
    };
  }

  return {
    filename: result?.filename || filename,
    uri: result?.uri,
    async save(blob) {
      const base64Data = await blobToBase64(blob);
      const saved = await DocumentSaver.writeFile({
        uri: result.uri,
        fileName: result?.filename || filename,
        base64Data
      });

      return {
        saved: true,
        native: true,
        filename: saved?.filename || result?.filename || filename,
        message: `Saved: ${saved?.filename || result?.filename || filename}`
      };
    }
  };
}

async function pickBrowserXlsxTarget(filename) {
  if (typeof window.showSaveFilePicker !== "function") {
    return null;
  }

  const handle = await window.showSaveFilePicker({
    suggestedName: filename,
    startIn: "documents",
    types: [
      {
        description: "Excel Workbook",
        accept: {
          [XLSX_MIME]: [".xlsx"]
        }
      }
    ]
  });

  return {
    filename: handle.name || filename,
    async save(blob) {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return {
        saved: true,
        filename: handle.name || filename,
        message: `Saved: ${handle.name || filename}`
      };
    }
  };
}

export async function pickXlsxSaveTarget(filename) {
  if (typeof window === "undefined") {
    return {
      unsupported: true,
      filename,
      message: "XLSX export is only available in the browser."
    };
  }

  const safeFilename = normalizeXlsxFilename(filename);

  try {
    if (canUseNativeDocumentSaver()) {
      return await pickNativeXlsxTarget(safeFilename);
    }

    const browserTarget = await pickBrowserXlsxTarget(safeFilename);
    if (browserTarget) {
      return browserTarget;
    }
  } catch (error) {
    if (isPickerCancel(error)) {
      return {
        canceled: true,
        filename: safeFilename,
        message: "Save cancelled."
      };
    }

    throw error;
  }

  return {
    unsupported: true,
    filename: safeFilename,
    message: "This browser cannot choose a folder/name for XLSX export. Open it in Chrome/Edge or update the Android app."
  };
}

export async function exportXlsx(targetOrFilename, rows, sheetName = "Orders") {
  const target =
    typeof targetOrFilename === "string"
      ? await pickXlsxSaveTarget(targetOrFilename)
      : targetOrFilename;

  if (target?.canceled || target?.unsupported) {
    return target;
  }

  if (!target || typeof target.save !== "function") {
    throw new Error("Choose a save location before exporting XLSX.");
  }

  const blob = await createWorkbookBlob(rows, sheetName);
  return target.save(blob);
}
