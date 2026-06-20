import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useSalonMedia, type MediaKind } from "@/hooks/useSalonProfile";
import { useToast } from "@/hooks/use-toast";

interface Props { salonId: string; }

const SECTIONS: { kind: Exclude<MediaKind, "logo">; label: string; description: string }[] = [
  { kind: "gallery", label: "Gallery", description: "General photos shown first on your profile" },
  { kind: "interior", label: "Interior", description: "Show off the look of your space" },
  { kind: "waiting", label: "Waiting Area", description: "Help customers know what to expect" },
  { kind: "service_area", label: "Service Area", description: "Chairs, stations, equipment" },
];

export function GalleryManager({ salonId }: Props) {
  const { media, isLoading, addFile, remove, reorder } = useSalonMedia(salonId);
  const { toast } = useToast();
  const [uploadingKind, setUploadingKind] = useState<MediaKind | null>(null);

  const handleFiles = async (kind: MediaKind, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingKind(kind);
    try {
      for (const f of Array.from(files)) {
        await addFile(kind, f);
      }
      toast({ title: "Photos uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingKind(null);
    }
  };

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const items = media.filter((m) => m.kind === section.kind).sort((a, b) => a.sort_order - b.sort_order);
        const inputRef = { current: null as HTMLInputElement | null };
        return (
          <Card key={section.kind}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="w-5 h-5" /> {section.label}
                  <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
              <label className="shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(section.kind, e.target.files)}
                />
                <Button type="button" variant="default" disabled={uploadingKind === section.kind} asChild>
                  <span className="cursor-pointer">
                    {uploadingKind === section.kind ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</>
                      : <><Upload className="mr-2 h-4 w-4" />Upload</>}
                  </span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
                  No photos yet. Upload some to make your profile shine.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((m, i) => (
                    <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-muted">
                      <img src={m.url} alt={m.caption ?? section.label} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                        <Button size="icon" variant="secondary" disabled={i === 0} onClick={() => reorder(m.id, "up")} aria-label="Move up">
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" disabled={i === items.length - 1} onClick={() => reorder(m.id, "down")} aria-label="Move down">
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => remove(m)} aria-label="Delete photo">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
