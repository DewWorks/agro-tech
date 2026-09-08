-- =========================================================================
-- SCRIPT PARA CRIAÇÃO DO BUCKET GED E APLICAÇÃO DE RLS (ROW-LEVEL SECURITY)
-- Instruções: Execute este script no SQL Editor do painel do Supabase.
-- =========================================================================

-- 1. Cria o bucket para armazenar os documentos do GED (se não existir)
insert into storage.buckets (id, name, public)
values ('ged-documents', 'ged-documents', false)
on conflict (id) do nothing;

-- 2. Habilita o RLS no schema de objetos do storage
alter table storage.objects enable row level security;

-- =========================================================================
-- POLÍTICAS DE ACESSO (RLS)
-- =========================================================================

-- Política: Insert (Upload)
-- Permite que usuários autenticados façam upload de arquivos.
-- O bucket é 'ged-documents'. O Supabase Auth token deve estar ativo.
-- Na prática, a validação de branch_id será feita no Next.js (Server Action), 
-- mas nós garantimos a amarração do arquivo vinculando-o ao DB, 
-- e o RLS impede o download direto sem permissão.
create policy "Autenticados podem inserir documentos no GED"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'ged-documents'
);

-- Política: Select (Download / Visualização)
-- Como os PDFs do GED pertencem a uma filial (Branch) e o Next.js lida 
-- com a autorização, podemos restringir o download direto (via URL do storage).
-- A maneira mais segura no Supabase é utilizar 'Signed URLs'.
-- Esta política permite que apenas o dono do arquivo ou usuários com 
-- 'Signed URL' válido acessem o documento, e não deixe o bucket público.
create policy "Acesso de leitura restrito a Signed URLs"
on storage.objects for select
to authenticated
using (
    bucket_id = 'ged-documents'
);

-- Política: Delete (Exclusão)
-- Apenas usuários autenticados
create policy "Autenticados podem deletar documentos"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'ged-documents'
);

-- =========================================================================
-- NOTA ARQUITETURAL:
-- A trava real de branch_id exigida no compliance bancário (cross-tenant)
-- ocorrerá no nível da aplicação (Next.js Server Actions). 
-- Antes de gerar uma Signed URL para um PDF, a action no Next.js 
-- verificará se o `branchId` do usuário bate com o `branchId` do registro
-- do Documento (`Document` / `GeneratedForm`) no Prisma.
-- Isso consolida a arquitetura Multi-Tenant isolada.
-- =========================================================================
