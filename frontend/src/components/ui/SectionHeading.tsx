import Link from "next/link";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  viewAllHref?: string;
}

export function SectionHeading({ eyebrow, title, viewAllHref }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-foreground-muted uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="font-mono text-xs tracking-widest text-accent uppercase hover:underline"
        >
          View all →
        </Link>
      )}
    </div>
  );
}
