import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "Yhttps://pblwtbwrmcvyiaqqzkhc.supabase.co/rest/v1/";
const supabaseAnonKey = "sb_publishable_-2UZvPyXSwrs3EKjNyMoVg_CUp_KxV7";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);