import React from "react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const variantClasses = {
  primary:
    "bg-[#E53935] text-white hover:bg-[#d32f2f] disabled:bg-[#f3b7b5] disabled:cursor-not-allowed",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed",
    
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-2.5 text-sm rounded-lg",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconLeft,
  iconRight,
  isLoading = false,
  loadingText,
  className,
  disabled,
  ...props
}) => {
  const effectiveDisabled = disabled || isLoading;
  const shouldOverlayLoading = isLoading && loadingText !== undefined;
  const showLoadingText = Boolean(loadingText);

  return (
    <button
      className={classNames(
        "relative inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#e53535]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      disabled={effectiveDisabled}
      aria-busy={isLoading}
      aria-disabled={effectiveDisabled}
      {...props}
    >
      <span
        className={classNames(
          "inline-flex items-center justify-center gap-2",
          shouldOverlayLoading && "opacity-0"
        )}
      >
        {iconLeft && <span className="shrink-0">{iconLeft}</span>}
        {!shouldOverlayLoading && isLoading && (
          <span
            className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent opacity-70 animate-spin"
            aria-hidden
          />
        )}
        <span>{children}</span>
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </span>

      {shouldOverlayLoading ? (
        <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent opacity-70 animate-spin"
            aria-hidden
          />
          {showLoadingText ? <span>{loadingText}</span> : null}
        </span>
      ) : null}
    </button>
  );
};

export default Button;
