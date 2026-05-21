import { createBrowserClient } from "@supabase/ssr";

// Dùng createBrowserClient thay vì createClient của @supabase/supabase-js
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);