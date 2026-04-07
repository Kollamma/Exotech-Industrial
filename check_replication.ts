import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkReplication() {
  console.log("Checking Database Replication Settings...");
  
  // Try to query the replication status via SQL if possible
  // Since we can't run arbitrary SQL easily, we'll try to check if the tables are in the publication
  // using a different approach if the previous one failed.
  
  const { data, error } = await supabase.from('operations').select('*').limit(1);
  if (error) {
    console.error("Error accessing 'operations' table:", error.message);
  } else {
    console.log("'operations' table is accessible.");
  }

  // Check if we can get any info about the 'realtime' schema
  const { data: schemaData, error: schemaError } = await supabase.from('information_schema.schemata').select('schema_name').eq('schema_name', 'realtime');
  if (schemaError) {
      console.error("Error checking for 'realtime' schema:", schemaError.message);
  } else {
      console.log("'realtime' schema exists:", schemaData.length > 0);
  }
}

checkReplication();
