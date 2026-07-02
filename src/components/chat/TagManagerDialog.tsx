import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export function TagManagerDialog({ trigger }: { trigger: React.ReactNode }) {
  const v = useRepoVersion();
  const tags = repo.listTags();
  void v;

  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; label: string } | null>(null);

  const reset = () => {
    setLabel("");
    setColor(PALETTE[0]);
    setEditingId(null);
  };

  const save = () => {
    const l = label.trim();
    if (!l) return;
    if (editingId) repo.updateTag(editingId, { label: l, color });
    else repo.createTag({ label: l, color });
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 min-h-8">
            {tags.length === 0 && (
              <div className="text-xs text-muted-foreground">Nenhuma tag ainda.</div>
            )}
            {tags.map((t) => (
              <div key={t.id} className="flex items-center gap-1 group">
                <TagChip tag={t} />
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditingId(t.id);
                    setLabel(t.label);
                    setColor(t.color);
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleting({ id: t.id, label: t.label })}
                  aria-label="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              {editingId ? "Editar tag" : "Nova tag"}
            </div>
            <Input
              placeholder="Nome da tag"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={30}
            />
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 ${
                    color === c ? "border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-6 w-6 rounded cursor-pointer"
                aria-label="Cor personalizada"
              />
            </div>
            <div className="flex gap-2 justify-end">
              {editingId && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={!label.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
