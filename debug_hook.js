require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testHookLogic() {
  console.log('Fetching users...')
  const { data, error } = await supabase.from('users').select('*')
  console.log('Error:', error)
  console.log('Users:', data)
}

testHookLogic()
