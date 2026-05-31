import ReceiptPageClient from "@/components/receipt/ReceiptPageClient";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReceiptPage({ params, searchParams }) {
  await requireSession();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const orderNo = decodeURIComponent(resolvedParams.id);

  return (
    <div className="page-fade flex justify-center py-6">
      <div className="w-full max-w-2xl">
        <ReceiptPageClient orderNo={orderNo} autoPrint={resolvedSearchParams.autoprint === "true"} />
      </div>
    </div>
  );
}
