import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
}

export function PasswordInput({
  className,
  inputClassName,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        type={visible ? "text" : "password"}
        {...props}
        className={cn("w-full", inputClassName, "pr-10")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 text-slate-400 hover:text-white focus:outline-none focus-visible:text-sky-300"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
