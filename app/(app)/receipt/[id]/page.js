import { notFound } from "next/navigation";
import BankReceipt from "@/components/receipt/BankReceipt";
import { getOrderByOrderNo } from "@/lib/orders";
import { requireSession } from "@/lib/session";

export default async function ReceiptPage({ params, searchParams }) {
  const session = await requireSession();
  const order = await getOrderByOrderNo(decodeURIComponent(params.id), session.user);

  if (!order) {
    notFound();
  }

  return (
    <div className="page-fade flex justify-center py-6">
      <div className="w-full max-w-2xl">
        <BankReceipt order={order} autoPrint={searchParams.autoprint === "true"} />
      </div>
    </div>
  );
}
