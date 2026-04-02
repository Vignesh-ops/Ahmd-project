"use client";

import Button from "@/components/ui/Button";

export default function InfoDialog({
  open,
  title,
  description,
  onClose,
  confirmLabel = "OK"
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="dialog-surface w-full max-w-sm rounded-xl border border-gold/20 p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-light/80">WhatsApp Share</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm text-white/65">{description}</p>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
