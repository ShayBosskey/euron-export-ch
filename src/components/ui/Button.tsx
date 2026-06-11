import Link from "next/link";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
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
    "inline-flex items-center justify-center font-semibold text-sm tracking-wide transition-all duration-200 rounded-sm px-8 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]";

  const variants = {
    primary:
      "bg-[var(--color-gold)] text-[var(--color-navy)] hover:bg-[var(--color-gold-light)] active:scale-[0.98]",
    outline:
      "border border-white text-white hover:bg-white hover:text-[var(--color-navy)] active:scale-[0.98]",
    ghost:
      "text-[var(--color-navy)] underline underline-offset-4 hover:text-[var(--color-gold)]",
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
    <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}
