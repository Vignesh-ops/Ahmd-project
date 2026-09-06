import ReceiptPageClient from "@/components/receipt/ReceiptPageClient";
import { getCachedOrderByOrderNo } from "@/lib/cache";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReceiptPage({ params, searchParams }) {
  const session = await requireSession();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const orderNo = decodeURIComponent(resolvedParams.id);
  const initialOrder = await getCachedOrderByOrderNo(orderNo, session.user.role, session.user.id);

  return (
    <div className="page-fade flex justify-center py-6">
      <div className="w-full max-w-2xl">
        <ReceiptPageClient
          orderNo={orderNo}
          autoPrint={resolvedSearchParams.autoprint === "true"}
          initialOrder={initialOrder}
        />
      </div>
    </div>
  );
}
