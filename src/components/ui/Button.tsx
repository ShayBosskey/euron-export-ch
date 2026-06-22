import Link from "next/link";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline-dark";
  className?: string;
  "data-hero-cta"?: string;
}

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2.5 font-bold text-sm tracking-[0.5px] uppercase h-12 px-7 border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--eu-recycle-green)]";

  const variants: Record<string, string> = {
    primary:
      "bg-[var(--eu-recycle-green)] text-white border-[var(--eu-recycle-green)] hover:bg-[var(--eu-recycle-green-active)] hover:border-[var(--eu-recycle-green-active)]",
    secondary:
      "bg-transparent text-[var(--eu-ink)] border-[var(--eu-hairline-strong)] hover:bg-[var(--eu-surface-soft)]",
    "outline-dark":
      "bg-transparent text-[var(--eu-on-dark)] border-[var(--eu-on-dark)] hover:bg-white/10",
  };

  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${variants[variant]} ${className}`}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
