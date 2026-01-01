"use client";
import { Clock } from "lucide-react";

interface DeliveryNoticeBadgeProps {
  days?: number;
  message?: string;
  variant?: "default" | "compact";
}

export default function DeliveryNoticeBadge({
  days = 15,
  message = "Produzido sob encomenda",
  variant = "default"
}: DeliveryNoticeBadgeProps) {
  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
        <Clock className="w-3 h-3" />
        {days} dias
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm font-medium">
      <Clock className="w-4 h-4" />
      <span>
        {message} • <strong>{days} dias úteis</strong>
      </span>
    </div>
  );
}
