import { Loader2 } from "lucide-react";

export function Spinner({ text = "Procesando en blockchain..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-slate-500 text-sm font-medium animate-pulse">{text}</p>
    </div>
  );
}
