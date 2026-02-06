import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Spinner = ({ className, size = 24, ...props }) => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Loader2
        className={cn("animate-spin text-primary", className)}
        size={size}
        {...props}
      />
    </div>
  );
};
