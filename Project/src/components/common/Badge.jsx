export function Badge({ status }) {
  const styles = {
    Cosechado: "bg-green-100 text-green-700 border-green-200",
    "En Camino": "bg-yellow-100 text-yellow-700 border-yellow-200",
    Entregado: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
    >
      {status}
    </span>
  );
}
