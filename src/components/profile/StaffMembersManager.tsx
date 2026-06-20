import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Save, Star, Trash2, User, X } from "lucide-react";
import { useStaffMembers, uploadSalonMediaFile, type StaffMember } from "@/hooks/useSalonProfile";
import { useToast } from "@/hooks/use-toast";

interface Props { salonId: string; }

const EMPTY = { name: "", role: "", experience_years: "0", specialization: "", bio: "", photo_url: "" };
type Draft = typeof EMPTY;

export function StaffMembersManager({ salonId }: Props) {
  const { staff, isLoading, create, update, remove, setFeatured, unsetFeatured } = useStaffMembers(salonId);
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const uploadPhoto = async (file: File, setUrl: (u: string) => void, target = "new") => {
    if (!file.type.startsWith("image/")) return toast({ title: "Image required", variant: "destructive" });
    if (file.size > 2 * 1024 * 1024) return toast({ title: "Max 2MB", variant: "destructive" });
    setUploadingFor(target);
    try {
      const { url } = await uploadSalonMediaFile(salonId, "staff", file);
      setUrl(url);
      toast({ title: "Photo uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingFor(null);
    }
  };

  const submitNew = async () => {
    if (!draft.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    try {
      await create({
        name: draft.name.trim(),
        role: draft.role.trim() || null,
        experience_years: Math.max(0, Number(draft.experience_years || 0)),
        specialization: draft.specialization.trim() || null,
        bio: draft.bio.trim() || null,
        photo_url: draft.photo_url || null,
      });
      setDraft(EMPTY);
      toast({ title: "Staff added" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const startEdit = (s: StaffMember) => {
    setEditingId(s.id);
    setEditDraft({
      name: s.name,
      role: s.role ?? "",
      experience_years: String(s.experience_years ?? 0),
      specialization: s.specialization ?? "",
      bio: s.bio ?? "",
      photo_url: s.photo_url ?? "",
    });
  };

  const submitEdit = async () => {
    if (!editingId) return;
    try {
      await update(editingId, {
        name: editDraft.name.trim(),
        role: editDraft.role.trim() || null,
        experience_years: Math.max(0, Number(editDraft.experience_years || 0)),
        specialization: editDraft.specialization.trim() || null,
        bio: editDraft.bio.trim() || null,
        photo_url: editDraft.photo_url || null,
      });
      setEditingId(null);
      toast({ title: "Staff updated" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Staff Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden border flex items-center justify-center">
              {draft.photo_url ? <img src={draft.photo_url} className="w-full h-full object-cover" alt="" /> : <User className="w-8 h-8 text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <Label>Photo</Label>
              <Input type="file" accept="image/*" disabled={uploadingFor === "new"}
                onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], (u) => setDraft({ ...draft, photo_url: u }), "new")} />
              {uploadingFor === "new" && <p className="text-xs text-muted-foreground mt-1"><Loader2 className="inline w-3 h-3 animate-spin mr-1" />Uploading…</p>}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Rahul" /></div>
            <div className="space-y-1"><Label>Role</Label><Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Senior Barber" /></div>
            <div className="space-y-1"><Label>Experience (years)</Label><Input type="number" min={0} value={draft.experience_years} onChange={(e) => setDraft({ ...draft, experience_years: e.target.value })} /></div>
            <div className="space-y-1"><Label>Specialization</Label><Input value={draft.specialization} onChange={(e) => setDraft({ ...draft, specialization: e.target.value })} placeholder="Hair Styling" /></div>
            <div className="space-y-1 md:col-span-2"><Label>Short Bio</Label><Textarea rows={2} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></div>
          </div>
          <Button onClick={submitNew}><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Team ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : staff.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">No staff yet.</p>
            : (
              <div className="grid gap-4 md:grid-cols-2">
                {staff.map((s) => editingId === s.id ? (
                  <div key={s.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                        {editDraft.photo_url ? <img src={editDraft.photo_url} className="w-full h-full object-cover" alt="" /> : <User className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <Input type="file" accept="image/*" disabled={uploadingFor === s.id}
                        onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], (u) => setEditDraft({ ...editDraft, photo_url: u }), s.id)} />
                    </div>
                    <Input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="Name" />
                    <Input value={editDraft.role} onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })} placeholder="Role" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" min={0} value={editDraft.experience_years} onChange={(e) => setEditDraft({ ...editDraft, experience_years: e.target.value })} />
                      <Input value={editDraft.specialization} onChange={(e) => setEditDraft({ ...editDraft, specialization: e.target.value })} placeholder="Specialization" />
                    </div>
                    <Textarea rows={2} value={editDraft.bio} onChange={(e) => setEditDraft({ ...editDraft, bio: e.target.value })} placeholder="Bio" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={submitEdit}><Save className="w-4 h-4 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4 mr-1" />Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div key={s.id} className="border rounded-lg p-3 flex gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {s.photo_url ? <img src={s.photo_url} className="w-full h-full object-cover" alt={s.name} /> : <User className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{s.name}</span>
                        {s.is_featured && <Badge className="bg-amber-500 hover:bg-amber-500"><Star className="w-3 h-3 mr-1 fill-current" />Most Requested</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{s.role}{s.experience_years ? ` · ${s.experience_years} yrs` : ""}</p>
                      {s.specialization && <p className="text-xs text-muted-foreground">{s.specialization}</p>}
                      {s.bio && <p className="text-xs mt-1 line-clamp-2">{s.bio}</p>}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {s.is_featured ? (
                          <Button size="sm" variant="outline" onClick={() => unsetFeatured(s.id)}><Star className="w-3 h-3 mr-1" />Unfeature</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setFeatured(s.id)}><Star className="w-3 h-3 mr-1" />Mark as Most Requested</Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => startEdit(s)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(s.id)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
                      </div>
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
