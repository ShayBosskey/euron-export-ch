interface SectionHeadingProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  centered?: boolean;
  light?: boolean;
}

export function SectionHeading({
  eyebrow,
  headline,
  subheadline,
  centered = false,
  light = false,
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-12 ${centered ? "text-center" : ""}`}
      data-reveal
    >
      {eyebrow && (
        <div
          className={`inline-flex items-center gap-3 mb-4 text-[13px] font-bold tracking-[1.5px] uppercase ${
            light ? "text-[var(--eu-on-dark-soft)]" : "text-[var(--eu-muted)]"
          }`}
        >
          <span
            className={`inline-block w-6 h-0.5 opacity-60 ${
              light ? "bg-[var(--eu-on-dark)]" : "bg-[var(--eu-ink)]"
            }`}
          />
          {eyebrow}
        </div>
      )}
      <h2
        className={`text-4xl md:text-5xl font-bold leading-tight mt-4 ${
          light ? "text-[var(--eu-on-dark)]" : "text-[var(--eu-ink)]"
        }`}
      >
        {headline}
      </h2>
      {subheadline && (
        <p
          className={`mt-4 text-lg leading-relaxed max-w-2xl ${centered ? "mx-auto" : ""} ${
            light ? "text-[var(--eu-on-dark-soft)]" : "text-[var(--eu-muted)]"
          }`}
        >
          {subheadline}
        </p>
      )}
    </div>
  );
}
