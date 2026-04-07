import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkRealtime() {
  console.log("Checking Supabase Realtime configuration...");
  
  // Check if supabase_realtime publication exists
  const { data: publications, error: pubError } = await supabase.rpc('get_publications');
  if (pubError) {
    console.error("Error fetching publications:", pubError);
    // Fallback to direct query if RPC is not available
    const { data: pubData, error: pubQueryError } = await supabase.from('pg_publication').select('*');
    if (pubQueryError) {
        console.error("Error querying pg_publication:", pubQueryError);
    } else {
        console.log("Publications:", pubData);
    }
  } else {
    console.log("Publications:", publications);
  }

  // Check which tables are in the supabase_realtime publication
  const { data: pubTables, error: tableError } = await supabase.from('pg_publication_tables').select('*').eq('pubname', 'supabase_realtime');
  if (tableError) {
    console.error("Error fetching publication tables:", tableError);
  } else {
    console.log("Tables in 'supabase_realtime' publication:", pubTables.map(t => t.tablename));
  }
  
  // Check if the tables exist
  const tablesToCheck = ['manifest_ledger', 'resource_stock', 'operations', 'scouts', 'rifts'];
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error checking table '${table}':`, error.message);
    } else {
      console.log(`Table '${table}' exists and is accessible.`);
    }
  }
}

checkRealtime();
