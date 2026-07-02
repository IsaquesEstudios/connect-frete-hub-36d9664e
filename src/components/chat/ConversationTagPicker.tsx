import { useState } from "react";
import { Check, Plus, Tag as TagIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { repo } from "@/lib/data";
import { useRepoVersion } from "@/lib/hooks/useRepo";
import { TagChip } from "./TagBadges";

const PALETTE = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

export function ConversationTagPicker({ conversationId }: { conversationId: string }) {
  const v = useRepoVersion();
  void v;
  const allTags = repo.listTags();
  const active = new Set(repo.getConversationTagIds(conversationId));
  const activeTags = allTags.filter((t) => active.has(t.id));

  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const toggle = (id: string) => {
    const next = new Set(active);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    repo.setConversationTags(conversationId, Array.from(next));
  };

  const createAndApply = () => {
    const label = newLabel.trim();
    if (!label) return;
    const tag = repo.createTag({ label, color: newColor });
    repo.setConversationTags(conversationId, [...active, tag.id]);
    setNewLabel("");
    setNewColor(PALETTE[0]);
    setCreating(false);
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
        <PopoverContent className="w-60 p-2" align="start">
          <div className="text-xs font-medium text-muted-foreground px-1 py-1">
            Aplicar tags
          </div>
          {allTags.length === 0 && !creating && (
            <div className="p-2 text-xs text-muted-foreground">
              Nenhuma tag ainda.
            </div>
          )}
          <div className="max-h-56 overflow-y-auto flex flex-col">
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

          <div className="border-t mt-1 pt-2">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent text-left text-sm text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar nova tag
              </button>
            ) : (
              <div className="space-y-2 px-1">
                <Input
                  autoFocus
                  placeholder="Nome da tag"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createAndApply();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  className="h-7 text-xs"
                  maxLength={30}
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`h-5 w-5 rounded-full border-2 ${
                        newColor === c ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setCreating(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 text-xs"
                    onClick={createAndApply}
                    disabled={!newLabel.trim()}
                  >
                    Criar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
