import { createClient } from "@supabase/supabase-js";

// ✅ Your project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Create client
export const supabase = createClient(supabaseUrl, supabaseKey);