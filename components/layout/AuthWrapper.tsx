"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Trạng thái chờ load kiểm tra bảo mật
  const [isLoading, setIsLoading] = useState(true);

  // Xác định xem người dùng có đang đứng ở trang Đăng nhập không
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const checkAuth = async () => {
      // Hỏi Supabase xem người dùng có chìa khoá (session) không
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && !isLoginPage) {
        // TRƯỜNG HỢP 1: Chưa đăng nhập mà dám mò vào trang trong -> Đuổi ra Login
        router.push("/login");
      } else if (session && isLoginPage) {
        // TRƯỜNG HỢP 2: Đã đăng nhập rồi mà mò lại vào Login -> Đẩy về trang chủ Dashboard
        router.push("/");
      } else {
        // TRƯỜNG HỢP 3: Hợp lệ -> Tắt màn hình chờ, cho phép hiển thị
        setIsLoading(false);
      }
    };

    checkAuth();

    // Lắng nghe sự kiện: Nếu chủ nhà ấn Đăng xuất, tự động văng ra ngoài ngay lập tức
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (event === "SIGNED_IN") {
        if (pathname === "/login") router.push("/");
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [pathname, router]);

  // MÀN HÌNH CHỜ BẢO MẬT (Che giấu hoàn toàn dữ liệu trong lúc kiểm tra)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-medium">
        <div className="flex flex-col items-center gap-4">
          {/* Vòng tròn xoay xoay */}
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          <p>Đang thiết lập kênh bảo mật...</p>
        </div>
      </div>
    );
  }

  // NẾU LÀ TRANG LOGIN: Chỉ hiển thị Form đăng nhập, giấu nhẹm Menu và Header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // NẾU LÀ TRANG QUẢN TRỊ (Đã đăng nhập): Render cấu trúc Layout ban đầu của bạn
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}