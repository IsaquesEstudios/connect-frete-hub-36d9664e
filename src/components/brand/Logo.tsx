import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  iconClassName,
  textClassName,
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Truck className={cn("h-6 w-6 text-white", iconClassName)} strokeWidth={2.25} />
      <span className={cn("font-semibold tracking-tight text-white whitespace-nowrap", textClassName)}>
        SV Logística
      </span>
    </span>
  );
}
