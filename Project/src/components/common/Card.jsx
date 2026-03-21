export function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-2xl shadow-sm border border-slate-100 p-5 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
