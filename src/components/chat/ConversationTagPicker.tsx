import { Check, Tag as TagIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { repo } from "@/lib/data";
import { useRepoVersion } from "@/lib/hooks/useRepo";
import { TagChip } from "./TagBadges";

export function ConversationTagPicker({ conversationId }: { conversationId: string }) {
  const v = useRepoVersion();
  void v;
  const allTags = repo.listTags();
  const active = new Set(repo.getConversationTagIds(conversationId));
  const activeTags = allTags.filter((t) => active.has(t.id));

  const toggle = (id: string) => {
    const next = new Set(active);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    repo.setConversationTags(conversationId, Array.from(next));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeTags.map((t) => (
        <TagChip key={t.id} tag={t} onRemove={() => toggle(t.id)} />
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[11px]">
            <TagIcon className="h-3 w-3 mr-1" />
            Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="text-xs font-medium text-muted-foreground px-1 py-1">
            Aplicar tags
          </div>
          {allTags.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground">
              Nenhuma tag cadastrada.
            </div>
          )}
          <div className="max-h-64 overflow-y-auto flex flex-col">
            {allTags.map((t) => {
              const on = active.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-sm flex-1 truncate">{t.label}</span>
                  {on && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
