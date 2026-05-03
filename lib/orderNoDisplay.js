export function formatDisplayOrderNo(orderNo) {
  const parts = String(orderNo || "").split("-");

  if (parts.length >= 5 && /^\d{8}$/.test(parts[2]) && ["idr", "inr"].includes(parts[3].toLowerCase())) {
    return [parts[0], parts[1], parts[3], ...parts.slice(4)].join("-");
  }

  return orderNo || "";
}
