import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function testRealtimeSubscription() {
  console.log("Testing Supabase Realtime Subscription...");
  console.log("URL:", process.env.SUPABASE_URL);

  const channel = supabase.channel("test-channel");

  channel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "manifest_ledger" },
      (payload) => console.log("manifest_ledger change:", payload)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "resource_stock" },
      (payload) => console.log("resource_stock change:", payload)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "operations" },
      (payload) => console.log("operations change:", payload)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "scouts" },
      (payload) => console.log("scouts change:", payload)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rifts" },
      (payload) => console.log("rifts change:", payload)
    )
    .subscribe((status, err) => {
      console.log("Subscription Status:", status);
      if (err) {
        console.error("Subscription Error Object:", JSON.stringify(err, null, 2));
        console.error("Error Message:", err.message);
      }
      
      if (status === "SUBSCRIBED") {
        console.log("Successfully subscribed! Realtime is working.");
        process.exit(0);
      }
      
      if (status === "CHANNEL_ERROR") {
        console.error("Received CHANNEL_ERROR. Realtime is NOT working.");
        // We'll wait a bit to see if more info comes in, then exit
        setTimeout(() => process.exit(1), 2000);
      }
    });

  // Keep the script running
  setTimeout(() => {
    console.log("Timeout reached. No subscription confirmed.");
    process.exit(1);
  }, 10000);
}

testRealtimeSubscription();
