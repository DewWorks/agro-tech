require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Iniciando migração DDL para Múltiplos Imóveis, ASTEC e Créditos em Ser...');
    await client.query('BEGIN');

    // 1. Enums
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "OfferedCollateralModality" AS ENUM (
          'FIANCA_AVALISTA',
          'ALIENACAO_FIDUCIARIA_IMOVEL',
          'HIPOTECA_RURAL_CEDULAR',
          'PATRIMONIO_RURAL_AFETACAO',
          'PENHOR_RURAL',
          'ANTICRESE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Enum OfferedCollateralModality verificado');

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "CreditPreferenceLine" AS ENUM (
          'AQUISICAO_MATRIZES_REPRODUTORES',
          'CONSTRUCAO_OBRAS_RURAIS',
          'CUSTEIO_PECUARIO_RECRIA_ENGORDA',
          'OUTRA'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Enum CreditPreferenceLine verificado');

    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'COMPROVANTE_EXPLORACAO_PECUARIA';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Enum DocumentType atualizado com COMPROVANTE_EXPLORACAO_PECUARIA');

    // 2. Coluna credit_analysis_id em generated_forms
    await client.query(`
      ALTER TABLE "generated_forms" 
      ADD COLUMN IF NOT EXISTS "credit_analysis_id" TEXT;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "generated_forms"
        ADD CONSTRAINT "generated_forms_credit_analysis_id_fkey"
        FOREIGN KEY ("credit_analysis_id") REFERENCES "credit_analyses"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "generated_forms_credit_analysis_id_idx" 
      ON "generated_forms"("credit_analysis_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "generated_forms_branch_id_idx" 
      ON "generated_forms"("branch_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "generated_forms_producer_id_idx" 
      ON "generated_forms"("producer_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "generated_forms_property_id_idx" 
      ON "generated_forms"("property_id");
    `);
    console.log('✓ Tabela generated_forms atualizada com credit_analysis_id e índices');

    // 3. Tabela generated_form_properties (Múltiplos Imóveis por Proposta)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "generated_form_properties" (
        "id" TEXT NOT NULL,
        "branch_id" TEXT NOT NULL,
        "form_id" TEXT NOT NULL,
        "property_id" TEXT NOT NULL,
        "is_enterprise_location" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "generated_form_properties_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "generated_form_properties_form_id_property_id_key" UNIQUE ("form_id", "property_id")
      );
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "generated_form_properties"
        ADD CONSTRAINT "generated_form_properties_branch_id_fkey"
        FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "generated_form_properties"
        ADD CONSTRAINT "generated_form_properties_form_id_fkey"
        FOREIGN KEY ("form_id") REFERENCES "generated_forms"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "generated_form_properties"
        ADD CONSTRAINT "generated_form_properties_property_id_fkey"
        FOREIGN KEY ("property_id") REFERENCES "properties"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "generated_form_properties_branch_id_idx" 
      ON "generated_form_properties"("branch_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "generated_form_properties_form_id_idx" 
      ON "generated_form_properties"("form_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "generated_form_properties_property_id_idx" 
      ON "generated_form_properties"("property_id");
    `);
    console.log('✓ Tabela generated_form_properties criada com integridade referencial');

    // 4. Tabela controlled_credits_in_debt (Operações Em Ser)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "controlled_credits_in_debt" (
        "id" TEXT NOT NULL,
        "branch_id" TEXT NOT NULL,
        "producer_id" TEXT NOT NULL,
        "form_id" TEXT,
        "credit_analysis_id" TEXT,
        "institution" TEXT NOT NULL,
        "credit_line" TEXT NOT NULL,
        "contract_date" TIMESTAMP(3) NOT NULL,
        "purpose" TEXT NOT NULL,
        "crop_year" TEXT NOT NULL,
        "amount" DECIMAL(15,2) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "controlled_credits_in_debt_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "controlled_credits_in_debt"
        ADD CONSTRAINT "controlled_credits_in_debt_branch_id_fkey"
        FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "controlled_credits_in_debt"
        ADD CONSTRAINT "controlled_credits_in_debt_producer_id_fkey"
        FOREIGN KEY ("producer_id") REFERENCES "producers"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "controlled_credits_in_debt"
        ADD CONSTRAINT "controlled_credits_in_debt_form_id_fkey"
        FOREIGN KEY ("form_id") REFERENCES "generated_forms"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "controlled_credits_in_debt"
        ADD CONSTRAINT "controlled_credits_in_debt_credit_analysis_id_fkey"
        FOREIGN KEY ("credit_analysis_id") REFERENCES "credit_analyses"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "controlled_credits_in_debt_branch_id_idx" 
      ON "controlled_credits_in_debt"("branch_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "controlled_credits_in_debt_producer_id_idx" 
      ON "controlled_credits_in_debt"("producer_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "controlled_credits_in_debt_form_id_idx" 
      ON "controlled_credits_in_debt"("form_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "controlled_credits_in_debt_credit_analysis_id_idx" 
      ON "controlled_credits_in_debt"("credit_analysis_id");
    `);
    console.log('✓ Tabela controlled_credits_in_debt criada com integridade referencial');

    // 5. Tabela astec_plurianual_projections (Demonstrativo Plurianual 10 Anos)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "astec_plurianual_projections" (
        "id" TEXT NOT NULL,
        "branch_id" TEXT NOT NULL,
        "form_id" TEXT NOT NULL,
        "credit_analysis_id" TEXT,
        "is_manual_override" BOOLEAN NOT NULL DEFAULT false,
        "payload" JSONB NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "astec_plurianual_projections_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "astec_plurianual_projections_form_id_key" UNIQUE ("form_id")
      );
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "astec_plurianual_projections"
        ADD CONSTRAINT "astec_plurianual_projections_branch_id_fkey"
        FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "astec_plurianual_projections"
        ADD CONSTRAINT "astec_plurianual_projections_form_id_fkey"
        FOREIGN KEY ("form_id") REFERENCES "generated_forms"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "astec_plurianual_projections"
        ADD CONSTRAINT "astec_plurianual_projections_credit_analysis_id_fkey"
        FOREIGN KEY ("credit_analysis_id") REFERENCES "credit_analyses"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "astec_plurianual_projections_branch_id_idx" 
      ON "astec_plurianual_projections"("branch_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "astec_plurianual_projections_credit_analysis_id_idx" 
      ON "astec_plurianual_projections"("credit_analysis_id");
    `);
    console.log('✓ Tabela astec_plurianual_projections criada com integridade referencial');

    await client.query('COMMIT');
    console.log('🎉 Migração DDL executada com sucesso absoluto no Supabase PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração DDL:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
