import { createAdminClient } from './src/lib/supabase/admin';

async function test() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('pedidos').select('id, cliente_id, estatus').limit(5);
  console.log(data);
}
test();
