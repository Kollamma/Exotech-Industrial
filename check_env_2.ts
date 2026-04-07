import dotenv from "dotenv";
dotenv.config();

console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 10) + "..." : "MISSING");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + "..." : "MISSING");
