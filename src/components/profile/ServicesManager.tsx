import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Scissors, Trash2, Save, Pencil, X } from "lucide-react";
import { useServices, type Service } from "@/hooks/useSalonProfile";
import { useToast } from "@/hooks/use-toast";

interface Props { salonId: string; }

const EMPTY = { name: "", price_rupees: "", duration_minutes: "15", category: "", parallel_capacity: "1" };

export function ServicesManager({ salonId }: Props) {
  const { services, isLoading, create, update, remove } = useServices(salonId);
  const { toast } = useToast();
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(EMPTY);

  const submitNew = async () => {
    if (!draft.name.trim()) return toast({ title: "Service name required", variant: "destructive" });
    const price = Math.max(0, Math.round(Number(draft.price_rupees || 0) * 100));
    const dur = Math.max(1, Number(draft.duration_minutes || 15));
    try {
      await create({
        name: draft.name.trim(),
        price_cents: price,
        duration_minutes: dur,
        category: draft.category.trim() || null,
        is_active: true,
      } as any);
      setDraft(EMPTY);
      toast({ title: "Service added" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditDraft({
      name: s.name,
      price_rupees: String(s.price_cents / 100),
      duration_minutes: String(s.duration_minutes),
      category: s.category ?? "",
    });
  };

  const submitEdit = async () => {
    if (!editingId) return;
    try {
      await update(editingId, {
        name: editDraft.name.trim(),
        price_cents: Math.max(0, Math.round(Number(editDraft.price_rupees || 0) * 100)),
        duration_minutes: Math.max(1, Number(editDraft.duration_minutes || 15)),
        category: editDraft.category.trim() || null,
      });
      setEditingId(null);
      toast({ title: "Service updated" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add a Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2 space-y-1">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Haircut" />
            </div>
            <div className="space-y-1">
              <Label>Price (₹)</Label>
              <Input type="number" min={0} value={draft.price_rupees} onChange={(e) => setDraft({ ...draft, price_rupees: e.target.value })} placeholder="200" />
            </div>
            <div className="space-y-1">
              <Label>Duration (min)</Label>
              <Input type="number" min={1} value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Hair / Skin / Beard" />
            </div>
          </div>
          <Button className="mt-4" onClick={submitNew}><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scissors className="w-5 h-5" /> Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : services.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">No services yet.</p>
            : (
              <div className="divide-y">
                {services.map((s) => editingId === s.id ? (
                  <div key={s.id} className="py-3 grid gap-2 md:grid-cols-5 items-end">
                    <Input className="md:col-span-2" value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                    <Input type="number" min={0} value={editDraft.price_rupees} onChange={(e) => setEditDraft({ ...editDraft, price_rupees: e.target.value })} />
                    <Input type="number" min={1} value={editDraft.duration_minutes} onChange={(e) => setEditDraft({ ...editDraft, duration_minutes: e.target.value })} />
                    <div className="flex gap-2">
                      <Input value={editDraft.category} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} />
                      <Button size="icon" onClick={submitEdit}><Save className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {s.name}
                        {s.category && <Badge variant="outline">{s.category}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">₹{(s.price_cents / 100).toFixed(0)} · {s.duration_minutes} min</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(s)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)} aria-label="Delete" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
