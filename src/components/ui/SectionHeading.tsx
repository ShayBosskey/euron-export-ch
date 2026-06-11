interface SectionHeadingProps {
  headline: string;
  subheadline?: string;
  centered?: boolean;
  light?: boolean;
}

export function SectionHeading({
  headline,
  subheadline,
  centered = false,
  light = false,
}: SectionHeadingProps) {
  return (
    <div
      className={centered ? "text-center" : ""}
      data-reveal
    >
      <h2
        className={`font-display text-4xl md:text-5xl font-bold leading-tight mb-4 ${
          light ? "text-white" : "text-[var(--color-navy)]"
        }`}
      >
        {headline}
      </h2>
      {subheadline && (
        <p
          className={`text-lg md:text-xl max-w-2xl ${centered ? "mx-auto" : ""} ${
            light ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-secondary)]"
          }`}
        >
          {subheadline}
        </p>
      )}
      <div
        className={`mt-4 h-1 w-16 rounded-full bg-[var(--color-gold)] ${centered ? "mx-auto" : ""}`}
      />
    </div>
  );
}
