import dotenv from "dotenv";
dotenv.config();

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + "..." : "MISSING");
console.log("SUPABASE_JWT_SECRET:", process.env.SUPABASE_JWT_SECRET ? "SET" : "MISSING");
