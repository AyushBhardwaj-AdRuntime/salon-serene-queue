
CREATE POLICY "salon_media_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'salon-media');

CREATE POLICY "salon_media_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'salon-media'
    AND public.is_salon_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "salon_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'salon-media'
    AND public.is_salon_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "salon_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'salon-media'
    AND public.is_salon_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
