import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

    // Trong middleware.ts
    const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
            });
        },
        },
    }
    );

    // --- SỬA ĐOẠN NÀY ---
    const pathname = request.nextUrl.pathname;
    const isPublicRoute = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname.startsWith('/auth/callback');

    // Chỉ gọi getUser() khi không phải trang public
    let user = null;
    if (!isPublicRoute) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    }
    // --- HẾT ĐOẠN SỬA ---

    // Nếu chưa đăng nhập mà truy cập route không phải công khai -> về login
    if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
    }

    // Nếu đã đăng nhập mà truy cập login/register -> về trang chủ
    if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
}

// Cấu hình không chạy middleware cho các file tĩnh và assets
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};