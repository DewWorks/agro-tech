require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

const ORG_ID = 'd4450841-c4ba-4558-8630-0f37aaec33d4';

async function main() {
  const logoHorizontalUrl = 'https://oyndfjrvjoyxrhstwign.supabase.co/storage/v1/object/public/organization-assets/d4450841-c4ba-4558-8630-0f37aaec33d4/branding/logo_horizontal_1792698669262.png';
  const logoIconUrl = 'https://oyndfjrvjoyxrhstwign.supabase.co/storage/v1/object/public/organization-assets/d4450841-c4ba-4558-8630-0f37aaec33d4/branding/logo_icon_1792698670566.png';
  const logoDarkUrl = 'https://oyndfjrvjoyxrhstwign.supabase.co/storage/v1/object/public/organization-assets/d4450841-c4ba-4558-8630-0f37aaec33d4/branding/logo_dark_1792698670872.png';

  const primaryColorHex = '#05964F'; // Spanish Green (Oficial da Identidade Visual)
  const accentColorHex = '#FFAC00';  // Leticia Flag Orange (Oficial da Identidade Visual)
  const tradeName = 'LN Consultoria e Projetos Rurais';

  console.log('Updating database record for LN...');
  const query = `
    UPDATE organizations
    SET 
      trade_name = $1,
      primary_color_hex = $2,
      accent_color_hex = $3,
      logo_horizontal_url = $4,
      logo_icon_url = $5,
      logo_dark_url = $6,
      "updatedAt" = NOW()
    WHERE id = $7
    RETURNING id, name, trade_name, cnpj, primary_color_hex, accent_color_hex, logo_horizontal_url, logo_icon_url, logo_dark_url
  `;

  const res = await pool.query(query, [
    tradeName,
    primaryColorHex,
    accentColorHex,
    logoHorizontalUrl,
    logoIconUrl,
    logoDarkUrl,
    ORG_ID
  ]);

  console.log('Updated Organization in DB:');
  console.log(JSON.stringify(res.rows[0], null, 2));
}

main()
  .catch(console.error)
  .finally(() => pool.end());
