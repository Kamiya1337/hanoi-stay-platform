"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, User, Bell, Menu, X, Home, Building2, Wallet, Users, Receipt } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  // State quản lý việc đóng/mở Menu trên điện thoại
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State lưu tên người dùng
  const [fullName, setFullName] = useState<string>("");

  // Fetch dữ liệu người dùng khi Header được render
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Thử lấy tên từ tài khoản Google (nếu đăng nhập bằng Google)
        let currentName = user.user_metadata?.full_name || user.user_metadata?.name || "";

        try {
          // 2. Ưu tiên lấy tên từ bảng profiles (nếu bạn đã vào Settings đổi tên)
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name') // Nhớ đảm bảo tên cột trong DB của bạn là full_name
            .eq('id', user.id)
            .single();

          if (data && data.full_name) {
            currentName = data.full_name;
          }
        } catch (err) {
          console.log("Chưa có profile trong DB, dùng tên mặc định");
        }

        // Cập nhật state nếu có tên
        if (currentName) {
          setFullName(currentName);
        }
      }
    }

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const isConfirm = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
    if (!isConfirm) return;
    try {
      await supabase.auth.signOut();
      window.location.href = "/login"; // Force redirect về trang login sau khi đăng xuất
    } catch (error) {
      alert("Lỗi khi đăng xuất!");
    }
  };

  const menuItems = [
    { name: "Tổng quan", icon: Home, path: "/" },
    { name: "Sơ đồ phòng", icon: Building2, path: "/buildings" },
    { name: "Khách thuê", icon: Users, path: "/tenants" },
    { name: "Thu chi", icon: Wallet, path: "/expenses" },
    { name: "Hoá đơn", icon: Receipt, path: "/invoice" },
  ];

  // Tên hiển thị (nếu chưa load xong thì để mặc định)
  const displayName = fullName || "Chủ đầu tư";

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        
        {/* CỘT TRÁI: Nút Hamburger & Lời chào */}
        <div className="flex items-center gap-3">
          {/* Nút Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Menu size={24} />
          </button>
          
          {/* Tên thương hiệu hiển thị trên Mobile */}
          <div className="md:hidden font-bold text-lg text-slate-800 flex items-center gap-2">
             <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center">
                <Home size={14} className="text-white" />
             </div>
             Hanoi Stay
          </div>

          {/* Lời chào hiển thị trên Desktop */}
          <div className="hidden md:block text-sm font-medium text-slate-600 ml-2">
            Xin chào, <span className="font-bold text-slate-900">{displayName}</span>!
          </div>
        </div>

        {/* CỘT PHẢI: Chuông thông báo & Profile & Nút Đăng xuất */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Nút Thông báo */}
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="flex items-center gap-1 md:gap-3">
            
            {/* Khu vực Profile - Biến thành Link để bấm vào cài đặt */}
            <Link 
              href="/settings" 
              className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-xl transition cursor-pointer"
              title="Cài đặt tài khoản"
            >
              <div className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-sm">
                <User size={16} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">Admin, {displayName}</p>
                <p className="text-xs text-slate-500 font-medium">Chỉnh sửa thông tin</p>
              </div>
            </Link>
            
            {/* Nút Đăng xuất trên PC */}
            <button 
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition ml-2"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE OVERLAY MENU (HIỆN RA KHI BẤM NÚT) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Lớp nền đen mờ đằng sau */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Menu trượt từ trái sang */}
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Home size={18} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Menu</h2>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition ${
                      isActive 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-semibold hover:bg-rose-100 transition"
              >
                <LogOut size={18} /> Đăng xuất hệ thống
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}