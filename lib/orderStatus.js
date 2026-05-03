"use client";

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function markOrderDone(order, { retries = 2 } = {}) {
  if (!order?.id || order.status === "done") {
    return order;
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`/api/orders/bank/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify({
          status: "done"
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not update order status.");
      }

      return payload;
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await wait(500 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("Could not update order status.");
}
