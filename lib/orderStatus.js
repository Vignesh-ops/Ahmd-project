"use client";

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function markOrderDone(order, { retries = 3 } = {}) {
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
        // Exponential backoff: 200ms, 400ms, 800ms
        await wait(200 * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error("Could not update order status.");
}

export async function verifyOrderStatus(orderId) {
  try {
    const response = await fetch(`/api/orders/bank/${orderId}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Could not fetch order.");
    }

    const payload = await response.json();
    return payload;
  } catch (error) {
    console.error("Failed to verify order status:", error);
    return null;
  }
}
