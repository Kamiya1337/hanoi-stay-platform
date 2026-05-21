import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    let response = NextResponse.redirect(`${origin}/`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Bỏ qua await ở đây vì setAll chạy đồng bộ, next.js sẽ tự handle
              cookieStore.set(name, value, options); 
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        // IN LỖI RA TERMINAL
        console.log("❌ LỖI TỪ SUPABASE:", error.message);
        console.log("❌ CHI TIẾT LỖI:", error);
      } else {
        console.log("✅ ĐĂNG NHẬP THÀNH CÔNG CHO USER:", data.user?.id);
        return response;
      }
    } catch (err) {
      console.log("❌ LỖI SERVER CATCH:", err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}