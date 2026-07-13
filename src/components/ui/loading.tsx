import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeClass = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ size = "md", label, className }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className ?? ""}`}>
      <Loader2 className={`${sizeClass[size]} animate-spin text-primary`} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

interface FullscreenLoadingProps {
  label?: string;
}

export function FullscreenLoading({ label = "Carregando..." }: FullscreenLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

export function InlineLoading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}
