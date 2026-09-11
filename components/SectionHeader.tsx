export default function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  light,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between ${
        light ? "border-ivory/15" : "border-charcoal/10"
      }`}
    >
      <div>
        <span
          className={`eyebrow flex items-center gap-3 ${light ? "text-champagne-gold-light" : "text-champagne-gold"}`}
        >
          {/* <span className="eyebrow-num text-base">{index}</span> */}
          {eyebrow}
        </span>
        <h2
          className={`section-title mt-3 text-4xl sm:text-6xl ${light ? "text-ivory" : "text-onyx"}`}
        >
          {title}
        </h2>
      </div>
      {description && (
        <p
          className={`max-w-xs text-sm leading-relaxed sm:text-right ${light ? "text-ivory/60" : "text-charcoal/60"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
