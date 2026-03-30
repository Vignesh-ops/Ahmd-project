"use client";

export async function markOrderDone(order) {
  if (!order?.id || order.status === "done") {
    return order;
  }

  const response = await fetch(`/api/orders/bank/${order.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: "done"
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Could not update order status.");
  }

  return payload;
}
