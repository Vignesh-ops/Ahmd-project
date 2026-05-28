"use client";

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
    type: "array"
  });

  // Create blob for download
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  // Trigger browser download with save dialog
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { 
    downloaded: true,
    filename: filename,
    message: `File ready to download: ${filename}`
  };
}