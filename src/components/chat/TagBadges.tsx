import type { Tag } from "@/lib/data/types";

export function TagChip({
  tag,
  onRemove,
  size = "sm",
}: {
  tag: Tag;
  onRemove?: () => void;
  size?: "xs" | "sm";
}) {
  const px = size === "xs" ? "px-1.5 py-0" : "px-2 py-0.5";
  const ts = size === "xs" ? "text-[9px]" : "text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white shrink-0 ${px} ${ts}`}
      style={{ backgroundColor: tag.color }}
    >
      {tag.label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 leading-none"
          aria-label={`Remover tag ${tag.label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

export function TagBadges({ tags, max = 3 }: { tags: Tag[]; max?: number }) {
  if (!tags.length) return null;
  const shown = tags.slice(0, max);
  const rest = tags.length - shown.length;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shown.map((t) => (
        <TagChip key={t.id} tag={t} size="xs" />
      ))}
      {rest > 0 && (
        <span className="text-[9px] text-muted-foreground">+{rest}</span>
      )}
    </div>
  );
}
