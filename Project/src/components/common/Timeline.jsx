import { CheckCircle, ShieldCheck } from "lucide-react";

export function Timeline({ nodes = [] }) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3.75 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary via-accent to-blue-500" />

      {nodes.map((node, i) => (
        <div key={i} className="relative mb-8 last:mb-0">
          {/* Dot */}
          <div
            className={`absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border-2 ${
              node.verified
                ? "bg-primary border-primary text-white"
                : "bg-white border-slate-300 text-slate-400"
            }`}
          >
            {node.verified ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <span className="w-2 h-2 bg-slate-300 rounded-full" />
            )}
          </div>

          {/* Content */}
          <div className="bg-surface border border-slate-100 rounded-2xl p-5 shadow-sm ml-2">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-slate-900">{node.title}</h4>
              {node.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-green-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Verificado
                </span>
              )}
            </div>
            {node.timestamp && (
              <p className="text-xs text-slate-400 mb-3">
                {new Date(node.timestamp).toLocaleString("es-MX")}
              </p>
            )}
            {node.content}
          </div>
        </div>
      ))}
    </div>
  );
}
