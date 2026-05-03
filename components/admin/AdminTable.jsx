import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminTable({ orders = [], onDelete, printMode = false }) {
  const wrapperClassName = printMode
    ? "admin-print-table-wrap"
    : "glass-panel overflow-hidden rounded-[28px] border border-white/5";
  const tableClassName = printMode
    ? "admin-print-table w-full text-left text-sm"
    : "min-w-[860px] w-full text-left text-sm";
  const headerClassName = printMode
    ? "text-xs uppercase tracking-[0.14em]"
    : "bg-white/5 text-xs uppercase tracking-[0.2em] text-white/35";
  const rowClassName = printMode ? "align-top" : "border-t border-white/5 align-top";

  return (
    <div className={wrapperClassName}>
      <div className={printMode ? "" : "overflow-x-auto"}>
        <table className={tableClassName}>
          <thead className={headerClassName}>
            <tr>
              <th className="px-4 py-4">Order No</th>
              <th className="px-4 py-4">Store</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Customer</th>
              <th className="px-4 py-4">Bank / Address</th>
              <th className="px-4 py-4">Amount</th>
              <th className="px-4 py-4">Status</th>
              {!printMode ? <th className="px-4 py-4">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={`${order.type}-${order.id}`} className={rowClassName}>
                <td className={printMode ? "px-4 py-4 font-mono" : "px-4 py-4 font-mono text-gold-light"}>{order.orderNo}</td>
                <td className={printMode ? "px-4 py-4" : "px-4 py-4 text-white/30"}>
                  {order.storeName}
                  <div className={printMode ? "text-xs text-black/70" : "text-xs text-white/35"}>{order.storeCode}</div>
                </td>
                <td className={printMode ? "px-4 py-4" : "px-4 py-4 text-white"}>{order.typeLabel}</td>
                <td className={printMode ? "px-4 py-4" : "px-4 py-4 text-white"}>{order.customerName}</td>
                <td className={printMode ? "px-4 py-4" : "px-4 py-4 text-white/65"}>{order.bankOrAddress}</td>
                <td className={printMode ? "px-4 py-4" : "px-4 py-4 text-white"}>
                  {formatCurrency(order.amount, order.currency)}
                  {order.totalPayableAmount ? (
                    <div className={printMode ? "text-xs text-black/70" : "text-xs text-white/45"}>
                      Payable {formatCurrency(order.totalPayableAmount, "MYR")}
                    </div>
                  ) : null}
                  <div className={printMode ? "text-xs text-black/70" : "text-xs text-white/35"}>{formatDate(order.date)}</div>
                </td>
                <td className="px-4 py-4">{printMode ? order.status : <StatusBadge status={order.status} />}</td>
                {!printMode ? (
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        href={`/receipt/${order.orderNo}`}
                      >
                        View Receipt
                      </Button>
                      {order.status === "pending" ? (
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          href={`/bank-order?edit=${order.id}`}
                        >
                          Edit
                        </Button>
                      ) : null}
                      <Button
                        variant="danger"
                        className="px-3 py-2 text-xs"
                        onClick={() => onDelete(order)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}

            {!orders.length ? (
              <tr>
                <td colSpan={printMode ? "7" : "8"} className={printMode ? "px-4 py-10 text-center" : "px-4 py-10 text-center text-white/45"}>
                  No orders found for the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
