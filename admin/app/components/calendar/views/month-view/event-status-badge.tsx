import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { TEventColor } from "@/app/components/calendar/types";

const eventStatusBadgeVariants = cva(
  "inline-flex items-center justify-center text-[0.5rem] font-medium leading-none border rounded-sm px-1 py-0.5 whitespace-nowrap",
  {
    variants: {
      color: {
        blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        green:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
        red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        yellow:
          "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
        purple:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        orange:
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
      },
      size: {
        xs: "text-[0.4rem] px-0.5 py-0",
        sm: "text-[0.5rem] px-1 py-0.5",
        md: "text-xs px-1.5 py-1",
      },
    },
    defaultVariants: {
      color: "blue",
      size: "sm",
    },
  }
);

function getStatusLabel(
  status?: "NOT_YET_ATTENDED" | "ATTENDED" | "ABSENT" | "CANCELLED"
): string {
  switch (status) {
    case "ATTENDED":
      return "Fait";
    case "ABSENT":
      return "Absent";
    case "CANCELLED":
      return "Annulé";
    case "NOT_YET_ATTENDED":
    default:
      return "À venir";
  }
}

function getPaymentLabel(paid?: boolean): string {
  return paid ? "Payé" : "Non payé";
}

export function EventStatusBadge({
  status,
  paid,
  color,
  size = "sm",
  showPayment = true,
  className,
}: {
  status?: "NOT_YET_ATTENDED" | "ATTENDED" | "ABSENT" | "CANCELLED";
  paid?: boolean;
  color: TEventColor;
  size?: "xs" | "sm" | "md";
  showPayment?: boolean;
  className?: string;
}) {
  const statusLabel = getStatusLabel(status);
  const paymentLabel = getPaymentLabel(paid);

  const fullLabel = showPayment
    ? `${statusLabel} • ${paymentLabel}`
    : statusLabel;

  return (
    <div className={cn(eventStatusBadgeVariants({ color, size }), className)}>
      {fullLabel}
    </div>
  );
}
