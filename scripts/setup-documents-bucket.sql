-- SQL Script para ser executado no painel do Supabase (SQL Editor)
-- Cria o bucket 'documents' privado e configura as políticas de RLS baseadas em branch_id.

-- 1. Criar o bucket 'documents' caso não exista
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Garantir que RLS está habilitado na tabela de objetos do storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Política de SELECT (Leitura): O usuário só pode baixar PDFs que estejam na pasta do seu branch_id
CREATE POLICY "Allow users to read documents from their branch"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = (SELECT branch_id::text FROM public.users WHERE id = auth.uid())
);

-- 4. Política de INSERT (Escrita): O usuário só pode salvar PDFs na pasta do seu branch_id
CREATE POLICY "Allow users to upload documents to their branch"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = (SELECT branch_id::text FROM public.users WHERE id = auth.uid())
);

-- 5. Política de DELETE (Exclusão): O usuário só pode apagar PDFs da pasta do seu branch_id
CREATE POLICY "Allow users to delete documents in their branch"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = (SELECT branch_id::text FROM public.users WHERE id = auth.uid())
);

-- 6. Política para SUPER_ADMIN (opcional, caso o SUPER_ADMIN precise ver tudo)
-- Descomente caso o SUPER_ADMIN utilize a plataforma de forma global para ler qualquer arquivo
-- CREATE POLICY "Allow SUPER_ADMIN to read all documents"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (
--   bucket_id = 'documents' AND 
--   'SUPER_ADMIN' = (SELECT role::text FROM public.users WHERE id = auth.uid())
-- );
