import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type StaffMember = Database["public"]["Tables"]["staff_members"]["Row"];
export type SalonMedia = Database["public"]["Tables"]["salon_media"]["Row"];
export type MediaKind = Database["public"]["Enums"]["salon_media_kind"];

const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

async function getSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("salon-media")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadSalonMediaFile(
  salonId: string,
  folder: string,
  file: File
): Promise<{ path: string; url: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${salonId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("salon-media")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const url = await getSignedUrl(path);
  return { path, url };
}

export async function deleteSalonMediaFile(path: string) {
  await supabase.storage.from("salon-media").remove([path]);
}

/** Services CRUD */
export function useServices(salonId?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    if (!salonId) return setIsLoading(false);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("salon_id", salonId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast({ title: "Failed to load services", description: error.message, variant: "destructive" });
    setServices(data || []);
    setIsLoading(false);
  }, [salonId, toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (payload: Omit<Service, "id" | "created_at" | "updated_at" | "salon_id" | "sort_order"> & { sort_order?: number }) => {
    if (!salonId) return;
    const { error } = await supabase.from("services").insert({
      salon_id: salonId,
      sort_order: services.length,
      ...payload,
    });
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, patch: Partial<Service>) => {
    const { error } = await supabase.from("services").update(patch).eq("id", id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;
    await fetch();
  };

  return { services, isLoading, refresh: fetch, create, update, remove };
}

/** Staff members CRUD */
export function useStaffMembers(salonId?: string) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    if (!salonId) return setIsLoading(false);
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .eq("salon_id", salonId)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Failed to load staff", description: error.message, variant: "destructive" });
    setStaff(data || []);
    setIsLoading(false);
  }, [salonId, toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (payload: Partial<StaffMember>) => {
    if (!salonId) return;
    const { error } = await supabase.from("staff_members").insert({
      salon_id: salonId,
      name: payload.name || "Unnamed",
      role: payload.role ?? null,
      experience_years: payload.experience_years ?? 0,
      specialization: payload.specialization ?? null,
      bio: payload.bio ?? null,
      photo_url: payload.photo_url ?? null,
      is_featured: false,
      sort_order: staff.length,
    });
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, patch: Partial<StaffMember>) => {
    const { error } = await supabase.from("staff_members").update(patch).eq("id", id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("staff_members").delete().eq("id", id);
    if (error) throw error;
    await fetch();
  };

  const setFeatured = async (id: string) => {
    if (!salonId) return;
    // Unset others first to satisfy unique partial index
    await supabase.from("staff_members").update({ is_featured: false }).eq("salon_id", salonId).neq("id", id);
    const { error } = await supabase.from("staff_members").update({ is_featured: true }).eq("id", id);
    if (error) throw error;
    await fetch();
  };

  const unsetFeatured = async (id: string) => {
    const { error } = await supabase.from("staff_members").update({ is_featured: false }).eq("id", id);
    if (error) throw error;
    await fetch();
  };

  return { staff, isLoading, refresh: fetch, create, update, remove, setFeatured, unsetFeatured };
}

/** Salon media CRUD */
export function useSalonMedia(salonId?: string) {
  const [media, setMedia] = useState<SalonMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    if (!salonId) return setIsLoading(false);
    const { data, error } = await supabase
      .from("salon_media")
      .select("*")
      .eq("salon_id", salonId)
      .order("kind", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Failed to load media", description: error.message, variant: "destructive" });
    setMedia(data || []);
    setIsLoading(false);
  }, [salonId, toast]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addFile = async (kind: MediaKind, file: File) => {
    if (!salonId) return;
    if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
    if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5MB");
    const folder = kind === "logo" ? "logo" : kind;
    const { path, url } = await uploadSalonMediaFile(salonId, folder, file);

    const existing = media.filter((m) => m.kind === kind);
    const { error } = await supabase.from("salon_media").insert({
      salon_id: salonId,
      kind,
      url,
      storage_path: path,
      sort_order: existing.length,
    });
    if (error) throw error;
    await fetch();
  };

  const remove = async (item: SalonMedia) => {
    if (item.storage_path) await deleteSalonMediaFile(item.storage_path);
    const { error } = await supabase.from("salon_media").delete().eq("id", item.id);
    if (error) throw error;
    await fetch();
  };

  const reorder = async (id: string, direction: "up" | "down") => {
    const item = media.find((m) => m.id === id);
    if (!item) return;
    const sameKind = media.filter((m) => m.kind === item.kind).sort((a, b) => a.sort_order - b.sort_order);
    const idx = sameKind.findIndex((m) => m.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sameKind.length) return;
    const other = sameKind[swapIdx];
    await supabase.from("salon_media").update({ sort_order: other.sort_order }).eq("id", item.id);
    await supabase.from("salon_media").update({ sort_order: item.sort_order }).eq("id", other.id);
    await fetch();
  };

  return { media, isLoading, refresh: fetch, addFile, remove, reorder };
}
