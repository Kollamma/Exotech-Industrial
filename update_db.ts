import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  // We can't run raw SQL easily without an RPC function, so I'll just check if the column exists
  // by doing a select. If it fails, the user needs to run the SQL.
  const { data, error } = await supabase.from('operations').select('system_id').limit(1);
  if (error) {
    console.error("Column system_id does not exist:", error.message);
  } else {
    console.log("Column system_id exists.");
  }
}
run();
