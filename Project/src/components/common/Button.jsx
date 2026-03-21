export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-dark active:scale-[0.97] shadow-md hover:shadow-lg",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.97]",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-white active:scale-[0.97]",
    danger: "bg-red-500 text-white hover:bg-red-600 active:scale-[0.97]",
    ghost: "text-slate-600 hover:bg-slate-100 active:scale-[0.97]",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[36px]",
    md: "px-5 py-3 text-base min-h-[48px]",
    lg: "px-7 py-4 text-lg min-h-[56px]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
